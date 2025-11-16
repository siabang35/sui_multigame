'use client';

import { useState, useCallback } from 'react';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function useGroqAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (userMessage: string, conversationHistory: AIMessage[] = []): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/groq-ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.message) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      return data.message;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('[v0] Groq AI error:', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { sendMessage, isLoading, error };
}
