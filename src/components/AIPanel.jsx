import React, { useState, useRef, useEffect } from 'react';
import { chatWithAI } from '../services/aiService';
import './AIPanel.css';

const QUICK_PROMPTS = [
  'What is FCFS scheduling?',
  'Explain Round Robin quantum',
  'What is the convoy effect?',
  'Compare SJF vs SRT',
  'What is starvation?',
  'How does MLFQ work?',
  'What is priority inversion?',
  'Best algorithm for interactive systems?',
];

export default function AIPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your OS scheduling tutor. Ask me anything about CPU scheduling algorithms, OS concepts, or how to use this simulator. Try a quick prompt below or type your own question!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    const userMsg = text.trim();
    if (!userMsg || loading) return;

    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Build conversation history for context
      const history = newMessages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content }));

      const reply = await chatWithAI(userMsg, history);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I couldn\'t process that. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        className={`ai-toggle-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="AI Knowledge Space"
      >
        <span className="ai-toggle-icon">{isOpen ? '✕' : '🤖'}</span>
        {!isOpen && <span className="ai-toggle-label">AI Help</span>}
      </button>

      {/* Panel */}
      <div className={`ai-panel ${isOpen ? 'open' : ''}`}>
        <div className="ai-panel-header">
          <div className="ai-panel-title">
            <span className="ai-panel-icon">🤖</span>
            <div>
              <h3>AI Knowledge Space</h3>
              <span className="ai-panel-subtitle">OS Scheduling Tutor</span>
            </div>
          </div>
          <div className="ai-panel-status">
            <span className="ai-status-dot"></span>
            <span className="ai-status-text">Online</span>
          </div>
        </div>

        <div className="ai-chat-area">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-message ${msg.role}`}>
              {msg.role === 'assistant' && (
                <span className="ai-message-avatar">🤖</span>
              )}
              <div className="ai-message-bubble">
                <p>{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <span className="ai-message-avatar user-avatar">👤</span>
              )}
            </div>
          ))}

          {loading && (
            <div className="ai-message assistant">
              <span className="ai-message-avatar">🤖</span>
              <div className="ai-message-bubble">
                <div className="ai-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick prompts */}
        <div className="ai-quick-prompts">
          <div className="ai-quick-scroll">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                className="ai-quick-btn"
                onClick={() => sendMessage(prompt)}
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="ai-input-area">
          <input
            ref={inputRef}
            type="text"
            className="ai-input"
            placeholder="Ask about scheduling algorithms..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className="ai-send-btn"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            ↵
          </button>
        </div>

        <div className="ai-panel-footer">
          Powered by Groq + OpenRouter · Free AI Models
        </div>
      </div>
    </>
  );
}
