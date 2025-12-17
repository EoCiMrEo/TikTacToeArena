import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const GameChat = ({ 
  messages = [], 
  onSendMessage = () => {},
  onSendEmoji = () => {},
  isExpanded = false,
  onToggleExpanded = () => {},
  disabled = false
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const quickMessages = [
    "Good luck!",
    "Nice move!",
    "Good game!",
    "Well played!",
    "Thanks!",
    "One more game?"
  ];

  const emojiReactions = [
    { emoji: '👍', label: 'thumbs up' },
    { emoji: '👎', label: 'thumbs down' },
    { emoji: '😄', label: 'happy' },
    { emoji: '😮', label: 'surprised' },
    { emoji: '🤔', label: 'thinking' },
    { emoji: '🔥', label: 'fire' },
    { emoji: '💪', label: 'strong' },
    { emoji: '🎉', label: 'celebration' }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && !disabled) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
      inputRef.current?.focus();
    }
  };

  const handleQuickMessage = (message) => {
    if (!disabled) {
      onSendMessage(message);
    }
  };

  const handleEmojiClick = (emoji) => {
    if (!disabled) {
      onSendEmoji(emoji);
      setShowEmojiPanel(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = (message, index) => {
    const isOwnMessage = message.sender === 'you';
    
    return (
      <div
        key={index}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}
      >
        <div className={`
          max-w-[80%] px-3 py-2 rounded-lg text-sm
          ${isOwnMessage 
            ? 'bg-primary text-white rounded-br-sm' :'bg-surface-secondary text-text-primary rounded-bl-sm'
          }
        `}>
          {!isOwnMessage && (
            <div className="text-xs font-medium mb-1 opacity-75">
              {message.senderName}
            </div>
          )}
          
          {message.type === 'emoji' ? (
            <div className="text-2xl">{message.content}</div>
          ) : (
            <div>{message.content}</div>
          )}
          
          <div className={`
            text-xs mt-1 opacity-60
            ${isOwnMessage ? 'text-right' : 'text-left'}
          `}>
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`
      bg-surface border border-border rounded-lg overflow-hidden
      ${isExpanded ? 'h-96' : 'h-48'}
      transition-all duration-300 ease-out
    `}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-surface-secondary">
        <div className="flex items-center space-x-2">
          <Icon name="MessageCircle" size={16} color="var(--color-text-primary)" />
          <span className="font-medium text-sm text-text-primary">Game Chat</span>
        </div>
        
        <Button
          variant="ghost"
          onClick={onToggleExpanded}
          className="p-1 h-auto"
          iconName={isExpanded ? "ChevronDown" : "ChevronUp"}
          iconSize={16}
        />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-48">
        {messages.length === 0 ? (
          <div className="text-center text-text-secondary text-sm py-8">
            <Icon name="MessageCircle" size={32} color="var(--color-text-tertiary)" className="mx-auto mb-2" />
            <p>No messages yet</p>
            <p className="text-xs mt-1">Send a message to start chatting!</p>
          </div>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Messages */}
      <div className="px-3 py-2 border-t border-border bg-surface-secondary">
        <div className="flex flex-wrap gap-1">
          {quickMessages.slice(0, 3).map((message, index) => (
            <Button
              key={index}
              variant="ghost"
              onClick={() => handleQuickMessage(message)}
              disabled={disabled}
              className="text-xs px-2 py-1 h-auto"
            >
              {message}
            </Button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center space-x-2">
          {/* Emoji Button */}
          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setShowEmojiPanel(!showEmojiPanel)}
              disabled={disabled}
              className="p-2 h-auto"
              iconName="Smile"
              iconSize={16}
            />
            
            {/* Emoji Panel */}
            {showEmojiPanel && (
              <div className="absolute bottom-full left-0 mb-2 bg-surface border border-border rounded-lg shadow-lg p-2 z-50">
                <div className="grid grid-cols-4 gap-1">
                  {emojiReactions.map((reaction, index) => (
                    <button
                      key={index}
                      onClick={() => handleEmojiClick(reaction.emoji)}
                      className="p-2 hover:bg-surface-secondary rounded text-lg transition-colors duration-150"
                      title={reaction.label}
                    >
                      {reaction.emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="flex-1">
            <Input
              ref={inputRef}
              type="text"
              placeholder={disabled ? "Chat disabled" : "Type a message..."}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={disabled}
              className="text-sm"
              maxLength={200}
            />
          </div>

          {/* Send Button */}
          <Button
            variant="primary"
            onClick={handleSendMessage}
            disabled={disabled || !newMessage.trim()}
            className="p-2 h-auto"
            iconName="Send"
            iconSize={16}
          />
        </div>
      </div>
    </div>
  );
};

export default GameChat;