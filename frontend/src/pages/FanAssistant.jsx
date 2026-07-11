import React, { useEffect, useRef, useState } from 'react';
import { Accessibility, Send, ShieldCheck } from 'lucide-react';
import ChatMessage from '../components/ChatMessage';
import { LANGUAGE_OPTIONS, LOCATION_OPTIONS, QUICK_PROMPTS } from '../constants/venue';
import { sendAssistantMessage } from '../services/api';

const INITIAL_MESSAGE = {
  id: 'welcome',
  text: 'Welcome to TournamentPulse AI! How can I assist you today?',
  sender: 'ai',
};

function createMessageId(prefix, index) {
  return `${prefix}-${Date.now()}-${index}`;
}

export default function FanAssistant() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('en');
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [currentNode, setCurrentNode] = useState('gate_a');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (typeof chatEndRef.current?.scrollIntoView === 'function') {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const trimmedText = text.trim();
    if (!trimmedText || loading) return;

    setMessages((previous) => [...previous, {
      id: createMessageId('user', previous.length),
      text: trimmedText,
      sender: 'user',
    }]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const data = await sendAssistantMessage({
        persona: 'fan',
        language,
        message: trimmedText,
        context: { accessibilityMode, currentNode },
      });

      setMessages((previous) => [...previous, {
        id: createMessageId('ai', previous.length),
        text: data.summary,
        action: data.recommended_action,
        reason: data.reason,
        priority: data.priority,
        source: data.source,
        route: data.route,
        sender: 'ai',
      }]);
    } catch (requestError) {
      console.error('[FanAssistant] Error:', requestError);
      setError('The assistant is having trouble connecting. Try a common destination below.');
      setMessages((previous) => [...previous, {
        id: createMessageId('error', previous.length),
        text: "I couldn't connect to the assistant. Please try a restroom, water refill, first aid, transit, or section request.",
        sender: 'ai',
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex-1 flex bg-white max-w-4xl mx-auto w-full shadow-lg border-x border-gray-100">
      <div className="flex-1 flex flex-col h-[calc(100vh-64px)]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-surface-lowest gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <label htmlFor="language-select" className="sr-only">Select language</label>
            <select id="language-select" value={language} onChange={(event) => setLanguage(event.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20">
              {LANGUAGE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <label htmlFor="current-location-select" className="sr-only">Select current location</label>
            <select id="current-location-select" value={currentNode} onChange={(event) => setCurrentNode(event.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20">
              {LOCATION_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button id="btn-accessibility-toggle" type="button" onClick={() => setAccessibilityMode((enabled) => !enabled)} aria-pressed={accessibilityMode} aria-label={accessibilityMode ? 'Disable accessible routing' : 'Enable accessible routing'} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${accessibilityMode ? 'bg-primary text-white' : 'bg-gray-50 border border-gray-200 text-gray-700'}`}>
              <Accessibility size={16} aria-hidden="true" /> Accessible Route
            </button>
          </div>
          <div className="flex items-center gap-1 text-xs font-mono text-gray-400" aria-live="polite">
            <ShieldCheck size={14} className="text-secondary" aria-hidden="true" /> Safe AI Active
          </div>
        </div>

        <div role="log" aria-label="Chat messages" aria-live="polite" aria-busy={loading} className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => <ChatMessage key={message.id} message={message} />)}
          {loading && <div className="flex justify-start"><div className="bg-surface-dim rounded-2xl p-4 text-gray-500 text-sm animate-pulse" aria-label="AI is thinking">Analyzing stadium data...</div></div>}
          {error && <p className="text-sm text-error" role="alert">{error}</p>}
          <div ref={chatEndRef} />
        </div>

        <div className="px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Quick prompts">
          {QUICK_PROMPTS.map((prompt, index) => <button key={prompt} id={`quick-prompt-${index}`} type="button" onClick={() => sendMessage(prompt)} disabled={loading} className="whitespace-nowrap px-4 py-2 bg-primary/5 hover:bg-primary/10 text-primary rounded-full text-sm font-medium transition-colors border border-primary/10 disabled:opacity-50">{prompt}</button>)}
        </div>

        <form className="px-6 py-4 bg-white border-t border-gray-100 shrink-0" onSubmit={(event) => { event.preventDefault(); sendMessage(input); }}>
          <div className="flex items-center gap-2 w-full">
            <label htmlFor="chat-input" className="sr-only">Type your message</label>
            <input ref={inputRef} id="chat-input" type="text" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); sendMessage(input); } }} maxLength={500} aria-describedby="chat-input-help" placeholder="Ask for directions, amenities, or assistance..." aria-label="Type your message to the AI assistant" className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all" />
            <button id="btn-send-message" type="submit" disabled={!input.trim() || loading} aria-label="Send message" className="bg-primary hover:bg-primary-container text-white p-3 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"><Send size={20} aria-hidden="true" /></button>
          </div>
          <p id="chat-input-help" className="text-xs text-gray-500 mt-2 text-right">{input.length}/500 characters · Enter to send</p>
        </form>
      </div>
    </div>
  );
}
