import { useState, useRef, useEffect } from 'react';
import type { Message } from '@shared/schema';

interface ChatProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  className?: string;
}

export function Chat({ messages, onSendMessage, className = "" }: ChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className={`glass-card rounded-3xl p-6 text-white shadow-xl ${className}`}>
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <i className="fas fa-comments mr-3"></i>
        Chat
      </h3>
      
      <div className="space-y-3 h-32 overflow-y-auto mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-bubble rounded-xl p-3 ${
              message.isSystem ? 'bg-blue-500/20 border border-blue-500/30' : ''
            }`}
          >
            {!message.isSystem && (
              <div className="text-xs text-gray-400 mb-1">{message.author}</div>
            )}
            <div className={`text-sm ${message.isSystem ? 'text-blue-300 font-medium' : ''}`}>
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="glass-input flex-1 py-2 px-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
          maxLength={200}
        />
        <button
          type="submit"
          className="glass-card p-2 rounded-xl hover:bg-white/20 transition-colors duration-200"
          disabled={!input.trim()}
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
}
