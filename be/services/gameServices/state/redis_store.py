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

-- basic validations
local user_id = ARGV[1]
local pos = tonumber(ARGV[2])
local board_size = 13
local win_len = 5
local max_idx = (board_size * board_size) - 1

if st.status ~= 'active' then return cjson.encode({ err = 'NOT_ACTIVE' }) end
if st.current_player_id ~= user_id then return cjson.encode({ err = 'NOT_YOUR_TURN' }) end
if pos < 0 or pos > max_idx then return cjson.encode({ err = 'BAD_POS' }) end
if st.board[pos + 1] ~= cjson.null then return cjson.encode({ err = 'CELL_TAKEN' }) end

-- apply move
local symbol = (user_id == st.player1_id) and 'X' or 'O'
st.board[pos + 1] = symbol
st.move_seq = (st.move_seq or 0) + 1
st.updated_at = tonumber(redis.call('TIME')[1])

-- Win Check Helper
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
    
    -- Check positive direction
    for i = 1, win_len - 1 do
        local r, c = row + (dr * i), col + (dc * i)
        if get_cell(st.board, r, c) == symbol then
            count = count + 1
            table.insert(line, r * board_size + c)
        else
            break
        end
    end
    
    -- Check negative direction
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
  st.winner_id = (winner == 'X') and st.player1_id or st.player2_id
else
  -- check draw
  local full = true
  for i=1, (board_size * board_size) do
    if st.board[i] == cjson.null then full = false break end
  end
  if full then
    st.status = 'completed'
    st.winner_id = cjson.null
  else
    -- switch turn
    if st.current_player_id == st.player1_id then
      st.current_player_id = st.player2_id
    else
      st.current_player_id = st.player1_id
    end
  end
end

-- persist
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
