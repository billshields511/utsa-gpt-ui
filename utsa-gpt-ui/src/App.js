import './App.css';
import { useState } from 'react';

function App() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);

  const handleSend = () => {
    if (inputValue.trim() === '') return;

    const userMessage = {
      sender: 'user',
      text: inputValue
    };

    const botMessage = {
      sender: 'bot',
      text: `You said: ${inputValue}`
    };

    setMessages([...messages, userMessage, botMessage]);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="container">
      <aside className="sidebar">
        <p>Chat History</p>
      </aside>

      <main className="main-content">
        <header className="chat-header">
          <h1>UTSA Chatbot GPT</h1>
        </header>

        <section className="chat-window">
          {messages.length === 0 ? (
            <p className="placeholder">Start a conversation...</p>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.sender === 'user'
                    ? 'message user-message'
                    : 'message bot-message'
                }
              >
                {message.text}
              </div>
            ))
          )}
        </section>

        <footer className="chat-input">
          <input
            type="text"
            placeholder="Type A message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={handleSend}>Send</button>
        </footer>
      </main>
    </div>
  );
}

export default App;