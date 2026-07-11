import React, { useState, useRef, useEffect } from 'react';
import { Send, Accessibility, ShieldCheck, MapPin } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function FanAssistant() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Welcome to TournamentPulse AI! How can I assist you today?", sender: "ai" }
  ]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('en');
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [loading, setLoading] = useState(false);

  /** @type {React.RefObject<HTMLDivElement>} */
  const chatEndRef = useRef(null);
  /** @type {React.RefObject<HTMLInputElement>} */
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (chatEndRef.current && typeof chatEndRef.current.scrollIntoView === 'function') {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  /**
   * Sends a message to the AI assistant and appends the response.
   * @param {string} text - The message text to send
   */
  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = { id: Date.now(), text, sender: "user" };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: 'fan',
          language,
          message: text,
          context: { accessibilityMode }
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }

      const aiMsg = {
        id: Date.now() + 1,
        text: data.summary,
        action: data.recommended_action,
        reason: data.reason,
        priority: data.priority,
        sender: "ai"
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('[FanAssistant] Error:', err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting right now. Please try again.",
        sender: "ai"
      }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const quickPrompts = [
    "Find my gate",
    "Where is the nearest restroom?",
    "How do I reach transit?",
    "Accessible route to Section 104",
    "Water refill station nearby"
  ];

  return (
    <div className="flex-1 flex bg-white max-w-4xl mx-auto w-full shadow-lg border-x border-gray-100">
      <div className="flex-1 flex flex-col h-[calc(100vh-64px)]">

        {/* Header Options */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-surface-lowest">
          <div className="flex items-center gap-2">
            <label htmlFor="language-select" className="sr-only">Select language</label>
            <select
              id="language-select"
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="pt">Português</option>
              <option value="ar">العربية</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
              <option value="zh">中文</option>
            </select>
            <button
              id="btn-accessibility-toggle"
              onClick={() => setAccessibilityMode(!accessibilityMode)}
              aria-pressed={accessibilityMode}
              aria-label={accessibilityMode ? 'Disable accessible routing' : 'Enable accessible routing'}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${accessibilityMode ? 'bg-primary text-white' : 'bg-gray-50 border border-gray-200 text-gray-700'}`}
            >
              <Accessibility size={16} aria-hidden="true" /> Accessible Route
            </button>
          </div>
          <div className="flex items-center gap-1 text-xs font-mono text-gray-400" aria-live="polite">
            <ShieldCheck size={14} className="text-secondary" aria-hidden="true" /> Safe AI Active
          </div>
        </div>

        {/* Chat Area */}
        <div
          role="log"
          aria-label="Chat messages"
          aria-live="polite"
          aria-busy={loading}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-surface-dim text-gray-800'}`}>
                <p className="break-words">{msg.text}</p>
                {msg.action && (
                  <div className="mt-3 bg-white/50 rounded-lg p-3 border border-white/20">
                    <p className="text-sm font-bold flex items-center gap-2 mb-1">
                      <MapPin size={14} aria-hidden="true" /> Recommendation
                    </p>
                    <p className="text-sm break-words">{msg.action}</p>
                    {msg.reason && <p className="text-xs text-gray-500 mt-1 italic break-words">{msg.reason}</p>}
                    {msg.priority && (
                      <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-mono ${
                        msg.priority === 'critical' ? 'bg-red-100 text-red-700' :
                        msg.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        msg.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {msg.priority.toUpperCase()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-surface-dim rounded-2xl p-4 text-gray-500 text-sm animate-pulse" aria-label="AI is thinking">
                Analyzing stadium data...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Quick prompts">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              id={`quick-prompt-${i}`}
              onClick={() => sendMessage(prompt)}
              className="whitespace-nowrap px-4 py-2 bg-primary/5 hover:bg-primary/10 text-primary rounded-full text-sm font-medium transition-colors border border-primary/10"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 bg-white border-t border-gray-100 shrink-0">
          <div className="flex items-center gap-2 w-full">
            <label htmlFor="chat-input" className="sr-only">Type your message</label>
            <input
              ref={inputRef}
              id="chat-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
              placeholder="Ask for directions, amenities, or assistance..."
              aria-label="Type your message to the AI assistant"
              className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
            />
            <button
              id="btn-send-message"
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              aria-label="Send message"
              className="bg-primary hover:bg-primary-container text-white p-3 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
