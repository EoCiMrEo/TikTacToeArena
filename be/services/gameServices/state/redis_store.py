"""
Redis-backed game state store for TicTacToe.

Avoids writing to SQL on every move by keeping active games in Redis.
Persist to SQL periodically and at end-of-game.
"""
from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, Optional, Tuple

import redis

# Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6382/0")
KEY_STATE = "game:{game_id}:state"
KEY_EVENTS = "game:{game_id}:events"
GAME_TTL_SECONDS = int(os.getenv("GAME_TTL_SECONDS", "86400"))  # 24h

BOARD_SIZE = 13
WIN_CONDITION = 5

def get_redis() -> redis.Redis:
    return redis.from_url(REDIS_URL, decode_responses=True)


def _key(fmt: str, game_id: str) -> str:
    return fmt.format(game_id=game_id)


def _new_board() -> list:
    return [None] * (BOARD_SIZE * BOARD_SIZE)


def create_game(game_id: str, player1_id: str, player2_id: Optional[str], settings: Dict[str, Any] = None) -> Dict[str, Any]:
    r = get_redis()
    state = {
        "player1_id": player1_id,
        "player2_id": player2_id,
        "current_player_id": player1_id if player2_id else None,
        "board": _new_board(),
        "status": "active" if player2_id else "waiting",
        "winner_id": None,
        "winning_line": None,
        "move_seq": 0,
        "settings": settings or {},
        "p1_time": (settings.get('timer', {}).get('initial') if settings else 120),
        "p2_time": (settings.get('timer', {}).get('initial') if settings else 120),
        "last_move_time": int(time.time()) if player2_id else None,
        "created_at": int(time.time()),
        "started_at": int(time.time()) if player2_id else None,
        "updated_at": int(time.time()),
    }
    r.setex(_key(KEY_STATE, game_id), GAME_TTL_SECONDS, json.dumps(state))
    return state


def get_state(game_id: str) -> Optional[Dict[str, Any]]:
    r = get_redis()
    data = r.get(_key(KEY_STATE, game_id))
    if not data:
        return None
    return json.loads(data)


# Lua script for atomic move application
# Logic: 
# 1. Update board
# 2. Check win condition (5 in a row) using direction vectors from the played position
# 3. Persist
LUA_APPLY_MOVE = """
local state_raw = redis.call('GET', KEYS[1])
if not state_raw then return cjson.encode({ err = 'NOT_FOUND' }) end
local st = cjson.decode(state_raw)

-- Args: user_id, pos, ttl
local user_id = ARGV[1]
local pos = tonumber(ARGV[2])
local board_size = 13
local win_len = 5
local max_idx = (board_size * board_size) - 1
-- Current server time for timer calc
local now = tonumber(redis.call('TIME')[1])

if st.status ~= 'active' then return cjson.encode({ err = 'NOT_ACTIVE' }) end
if st.current_player_id ~= user_id then return cjson.encode({ err = 'NOT_YOUR_TURN' }) end
if pos < 0 or pos > max_idx then return cjson.encode({ err = 'BAD_POS' }) end
if st.board[pos + 1] ~= cjson.null then return cjson.encode({ err = 'CELL_TAKEN' }) end

-- 1. Apply Move
local symbol = (user_id == st.player1_id) and 'X' or 'O'
st.board[pos + 1] = symbol
st.move_seq = (st.move_seq or 0) + 1

-- 2. Timer Logic (Chess Style)
local is_p1 = (user_id == st.player1_id)
local settings = st.settings or {}
local timer_cfg = settings.timer or { initial = 120, increment = 5 } 
local increment = timer_cfg.increment or 0

-- Deduct time used (if not first moves? usually applies always except maybe very first)
-- Actually, started_at is when p2 joined.
local last_time = st.last_move_time or st.started_at or now
local elapsed = now - last_time

if is_p1 then
   st.p1_time = (st.p1_time or timer_cfg.initial) - elapsed + increment
   if st.p1_time < 0 then st.p1_time = 0 end -- Timeout check could happen here
else
   st.p2_time = (st.p2_time or timer_cfg.initial) - elapsed + increment
   if st.p2_time < 0 then st.p2_time = 0 end
end

st.last_move_time = now
st.updated_at = now

-- 3. Win Check
local function get_cell(b, r, c)
    if r < 0 or r >= board_size or c < 0 or c >= board_size then return nil end
    local idx = (r * board_size) + c
    return b[idx + 1]
end

local row = math.floor(pos / board_size)
local col = pos % board_size
local directions = {
    {0, 1},   -- Horizontal
    {1, 0},   -- Vertical
    {1, 1},   -- Diagonal \
    {1, -1}   -- Diagonal /
}

local winner = nil
local winning_line = {}

for _, d in ipairs(directions) do
    local dr, dc = d[1], d[2]
    local count = 1
    local line = {pos}
    
    -- Forward
    for i = 1, win_len - 1 do
        local r, c = row + (dr * i), col + (dc * i)
        if get_cell(st.board, r, c) == symbol then
            count = count + 1
            table.insert(line, r * board_size + c)
        else
            break
        end
    end
    
    -- Backward
    for i = 1, win_len - 1 do
        local r, c = row - (dr * i), col - (dc * i)
        if get_cell(st.board, r, c) == symbol then
            count = count + 1
            table.insert(line, r * board_size + c)
        else
            break
        end
    end
    
    if count >= win_len then
        winner = symbol
        winning_line = line
        break
    end
end

if winner then
  st.status = 'completed'
  st.winning_line = winning_line
  st.winner_id = user_id
elseif st.p1_time == 0 or st.p2_time == 0 then
  -- Handle Timeout
  st.status = 'completed'
  st.winner_id = (st.p1_time == 0) and st.player2_id or st.player1_id
  st.winning_line = {} -- No line for timeout
else
  -- Check draw
  local full = true
  for i=1, (board_size * board_size) do
    if st.board[i] == cjson.null then full = false break end
  end
  if full then
    st.status = 'completed'
    st.winner_id = cjson.null
  else
    -- Switch Turn
    if st.current_player_id == st.player1_id then
      st.current_player_id = st.player2_id
    else
      st.current_player_id = st.player1_id
    end
  end
end

redis.call('SETEX', KEYS[1], tonumber(ARGV[3]), cjson.encode(st))
return cjson.encode({ ok = true, state = st })
"""


def apply_move(game_id: str, user_id: str, position: int) -> Dict[str, Any]:
    r = get_redis()
    state_key = _key(KEY_STATE, game_id)
    try:
        res = r.eval(LUA_APPLY_MOVE, 1, state_key, user_id, str(position), str(GAME_TTL_SECONDS))
        data = json.loads(res)
        if data.get("err"):
            return {"success": False, "error": data["err"]}
        return {"success": True, "state": data["state"]}
    except redis.RedisError as e:
        return {"success": False, "error": f"REDIS_ERR:{e}"}
