import './App.css';
import { useState } from 'react';

const generateId = () => Date.now().toString();

// Load messages from localStorage
const loadMessages = () => {
  const stored = localStorage.getItem('messages');
  if (stored) {
    const parsed = JSON.parse(stored);
    if (!parsed.History) {
      return { conversation_id: generateId(), History: [] };
    }
    return parsed;
  }
  return { conversation_id: generateId(), History: [] };
};

// Save messages to localStorage
const saveMessages = (messages) => {
  localStorage.setItem('messages', JSON.stringify(messages));
};

function App() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState(loadMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    if (inputValue.trim() === '') return;

    const userMessage = { role: 'user', content: inputValue };

    // Optimistically add user message
    const withUser = {
      ...messages,
      History: [...messages.History, userMessage]
    };
    setMessages(withUser);
    saveMessages(withUser);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: inputValue })
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();

      const botMessage = {
        role: 'bot',
        content: data.answer,
        sources: data.source
      };

      const withBot = {
        ...withUser,
        History: [...withUser.History, botMessage]
      };

      setMessages(withBot);
      saveMessages(withBot);

    } catch (err) {
      setError('Failed to get a response. Please try again.');
      console.error('API error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleClear = () => {
    const fresh = { conversation_id: generateId(), History: [] };
    setMessages(fresh);
    saveMessages(fresh);
  };

  return (
    <div className="container">
      <aside className="sidebar">
        <p>Chat History</p>
        <button onClick={handleClear}>Clear Chat</button>
      </aside>

      <main className="main-content">
        <header className="chat-header">
          <h1>UTSA Chatbot GPT</h1>
        </header>

        <section className="chat-window">
          {messages.History.length === 0 ? (
            <p className="placeholder">Start a conversation...</p>
          ) : (
            messages.History.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === 'user'
                    ? 'message user-message'
                    : 'message bot-message'
                }
              >
                <p>{message.content}</p>
                {/* Show sources if available on bot messages */}
                {message.role === 'bot' && message.sources && message.sources.length > 0 && (
                  <div className="sources">
                    <small>Sources:</small>
                    <ul>
                      {message.sources.map((source, i) => (
                        <li key={i}><small>{source}</small></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
          {/* Loading indicator */}
          {isLoading && (
            <div className="message bot-message">
              <p>Thinking...</p>
            </div>
          )}
          {/* Error message */}
          {error && (
            <div className="message bot-message error">
              <p>{error}</p>
            </div>
          )}
        </section>

        <footer className="chat-input">
          <input
            type="text"
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button onClick={handleSend} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </footer>
      </main>
    </div>
  );
}

export default App;