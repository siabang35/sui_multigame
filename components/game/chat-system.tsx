'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '@/lib/game-state';
import { useGroqAI, AIMessage } from '@/hooks/use-groq-ai';

interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
  isSystemMessage?: boolean;
  isAIMessage?: boolean;
}

export function ChatSystem() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [aiConversation, setAiConversation] = useState<AIMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'ai'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);
  const gameState = useGameStore((state) => state.game);
  const { sendMessage, isLoading } = useGroqAI();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiConversation]);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const setupSubscription = async () => {
      if (!gameState.gameId) return;

      // Clean up previous subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      try {
        const suiGameService = require('@/lib/sui-game-service').suiGameService;

        const unsubscribe = await suiGameService.subscribeToGameEvents(
          gameState.gameId,
          (event: any) => {
            if (event.type === 'PlayerJoined') {
              const playerAddr = event.data.player_address;
              setMessages((prev) => [
                ...prev,
                {
                  playerId: 'system',
                  playerName: 'System',
                  message: `Player ${playerAddr.slice(0, 6)}... joined the game`,
                  timestamp: event.timestamp,
                  isSystemMessage: true,
                },
              ]);
            } else if (event.type === 'PlayerDied') {
              const killer = event.data.killer.slice(0, 6);
              const victim = event.data.player_address.slice(0, 6);
              setMessages((prev) => [
                ...prev,
                {
                  playerId: 'system',
                  playerName: 'System',
                  message: `${killer}... defeated ${victim}...`,
                  timestamp: event.timestamp,
                  isSystemMessage: true,
                },
              ]);
            }
          }
        );

        unsubscribeRef.current = unsubscribe;
      } catch (error) {
        console.error('Error subscribing to chat events:', error);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [gameState.gameId]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !gameState.currentPlayer || !gameState.gameId) return;

    const newMessage: ChatMessage = {
      playerId: gameState.currentPlayer.id,
      playerName: gameState.currentPlayer.username,
      message: inputValue,
      timestamp: Date.now(),
    };

    setMessages([...messages, newMessage]);
    setInputValue('');

    console.log('Chat message sent:', newMessage);
  };

  const handleSendAIMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    
    const updatedConversation = [
      ...aiConversation,
      { role: 'user' as const, content: userMessage },
    ];
    
    setAiConversation(updatedConversation);
    setInputValue('');

    try {
      const aiResponse = await sendMessage(userMessage, aiConversation);
      
      setAiConversation((prev) => [
        ...prev,
        { role: 'assistant', content: aiResponse },
      ]);

      console.log('AI response received:', aiResponse);
    } catch (error) {
      console.error('AI error:', error);
      
      setAiConversation((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Try again!' },
      ]);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 w-96 pointer-events-auto z-40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="button-neon text-sm mb-2 w-full flex items-center justify-between"
      >
        <span>CHAT & AI GUIDE</span>
        <span className="flex items-center gap-2">
          {(messages.length > 0 || aiConversation.length > 0) && (
            <span className="text-xs bg-accent px-2 py-1 rounded">
              {activeTab === 'chat' ? messages.length : aiConversation.length}
            </span>
          )}
          <span>{isOpen ? '▼' : '▶'}</span>
        </span>
      </button>

      {isOpen && (
        <div className="stat-box flex flex-col h-96 space-y-2">
          <div className="flex gap-2 border-b border-primary/30 pb-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 text-xs font-semibold px-2 py-1 rounded transition-colors ${
                activeTab === 'chat'
                  ? 'bg-primary text-background'
                  : 'bg-background border border-primary/30 text-muted-foreground hover:text-primary'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 text-xs font-semibold px-2 py-1 rounded transition-colors ${
                activeTab === 'ai'
                  ? 'bg-primary text-background'
                  : 'bg-background border border-primary/30 text-muted-foreground hover:text-primary'
              }`}
            >
              AI Guide
            </button>
          </div>

          {activeTab === 'chat' && (
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {messages.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  No messages. Start chatting!
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`text-xs ${
                      msg.isSystemMessage
                        ? 'text-yellow-500 italic text-center py-1'
                        : ''
                    }`}
                  >
                    {!msg.isSystemMessage && (
                      <>
                        <span className="text-primary font-bold">{msg.playerName}:</span>
                        <span className="text-muted-foreground ml-2">{msg.message}</span>
                      </>
                    )}
                    {msg.isSystemMessage && (
                      <span>{msg.message}</span>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {aiConversation.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4 space-y-2">
                  <div>Ask me anything about MULTIPLY!</div>
                  <div className="text-primary text-xs">
                    Tips: strategies • controls • combat • abilities • ranking
                  </div>
                </div>
              ) : (
                aiConversation.map((msg, index) => (
                  <div
                    key={index}
                    className={`text-xs p-2 rounded ${
                      msg.role === 'user'
                        ? 'bg-primary/10 text-primary ml-4'
                        : 'bg-accent/10 text-accent mr-4'
                    }`}
                  >
                    <span className="font-semibold">
                      {msg.role === 'user' ? 'You:' : 'AI Guide:'}
                    </span>
                    <span className="ml-2 text-xs">{msg.content}</span>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="text-xs text-accent italic text-center py-2">
                  AI is thinking...
                </div>
              )}
              <div ref={aiMessagesEndRef} />
            </div>
          )}

          <div className="flex gap-2 border-t border-primary/30 pt-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  if (activeTab === 'chat') {
                    handleSendMessage();
                  } else {
                    handleSendAIMessage();
                  }
                }
              }}
              placeholder={activeTab === 'chat' ? 'Type message...' : 'Ask AI a question...'}
              maxLength={200}
              className="flex-1 bg-background border border-primary/30 rounded px-2 py-1 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/80"
              disabled={activeTab === 'chat' ? !gameState.currentPlayer : isLoading}
            />
            <button
              onClick={activeTab === 'chat' ? handleSendMessage : handleSendAIMessage}
              disabled={
                !inputValue.trim() ||
                (activeTab === 'chat' ? !gameState.currentPlayer : isLoading)
              }
              className="button-neon text-xs px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
