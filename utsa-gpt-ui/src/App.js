import './App.css';
import { useEffect, useState } from 'react';

const generateId = () => Date.now().toString();

// Creates a new conversation object with a unique ID, default title, and empty history
const createNewConversation = () => {
  const id = generateId();
  return {
    conversation_id: id,
    title: `Conversation ${id}`,
    History: []
  };
};

// Load conversations from localStorage if they exist, otherwise start with an empty array
const loadConversations = () => {
  const stored = localStorage.getItem('conversations');

  if (stored) {
    return JSON.parse(stored);
  }

  return [];
};

const saveConversations = (conversations) => {
  localStorage.setItem('conversations', JSON.stringify(conversations));
};

// Placeholder title API call aidan will work on here to rename conversations based on their content instead of just "Conversation 123456789"
const getConversationTitle = async (conversation) => {
  try {
    const response = await fetch('http://localhost:8000/conversation-title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: conversation })
    });

    if (!response.ok) throw new Error('Title API failed');

    const data = await response.json();

    return data.title;
  } catch (error) {
    return `Conversation ${conversation.conversation_id}`;
  }
};

function App() {
  const [inputValue, setInputValue] = useState('');

  // Loads old saved conversations for sidebar
  const [conversations, setConversations] = useState(loadConversations);

  // Every fresh page load starts with a brand new chat
  const [activeConversation, setActiveConversation] = useState(createNewConversation);

  // For handling which conversation's dropdown menu is open
  const [openMenu, setOpenMenu] = useState(null);

  // To show loading state when waiting for bot response
  const [isLoading, setIsLoading] = useState(false);

  // To show error messages when API calls fail
  const [error, setError] = useState(null);

  // Load theme from localStorage or default to 'dark'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);


  // Close any open dropdown menu when clicking outside of option dropdown in each converssation item
  useEffect(() => {
    const closeMenu = () => {
      setOpenMenu(null);
    };
    document.addEventListener('click', closeMenu);
    return () => {
      document.removeEventListener('click', closeMenu);
    };
  }, []);


  // Toggle between light and dark themes 
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));//gets the string to find wchich css to use 
  };

  // Start a new chat by creating a new conversation and setting it as active
  const handleNewChat = () => {
    setActiveConversation(createNewConversation());
    setInputValue('');
    setError(null);
    setOpenMenu(null);
  };

  // Save a new conversation or update an existing one in the conversations list
  const saveOrUpdateConversation = (updatedConversation) => {
    setConversations((prev) => {
      const alreadyExists = prev.some(
        (conversation) =>
          conversation.conversation_id === updatedConversation.conversation_id
      );

      // If it already exists, update it. Otherwise, add it to the top of the list.
      if (alreadyExists) {
        return prev.map((conversation) =>
          conversation.conversation_id === updatedConversation.conversation_id
            ? updatedConversation
            : conversation
        );
      }

      // Newest conversations go at the top
      return [updatedConversation, ...prev];
    });
  };

  // Handle sending a message: update conversation with user's question, call API, then update with bot's answer
  const handleSend = async () => {
    if (inputValue.trim() === '') return;

    const userQuestion = inputValue;

    const userMessage = {
      role: 'user',
      content: userQuestion
    };

    const withUserMessage = {
      ...activeConversation,
      History: [...activeConversation.History, userMessage]
    };

    setActiveConversation(withUserMessage);
    saveOrUpdateConversation(withUserMessage);

    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userQuestion })
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();

      const botMessage = {
        role: 'bot',
        content: data.answer,
        sources: data.source
      };

      let withBotMessage = {
        ...withUserMessage,
        History: [...withUserMessage.History, botMessage]
      };

      // Try to rename conversation using placeholder API
      const title = await getConversationTitle(withBotMessage);

      withBotMessage = {
        ...withBotMessage,
        title: title
      };

      setActiveConversation(withBotMessage);
      saveOrUpdateConversation(withBotMessage);
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

  /* testing to see if the clear chat works on new option button */
  const handleClearConversation = (conversationId, e) => {
    e.stopPropagation();

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.conversation_id === conversationId
          ? { ...conversation, History: [] }
          : conversation
      )
    );

    if (activeConversation.conversation_id === conversationId) {
      setActiveConversation((prev) => ({
        ...prev,
        History: []
      }));
    }

    setOpenMenu(null);
  };

  // When a conversation is selected from the sidebar, set it as the active conversation and reset input and error states
  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
    setInputValue('');
    setError(null);
    setOpenMenu(null);;
  };

  /* to delete convo on side bar */
  const handleDeleteConversation = (conversationId, e) => {
    e.stopPropagation();

    const updatedConversations = conversations.filter(
      (conversation) => conversation.conversation_id !== conversationId
    );

    setConversations(updatedConversations);

    if (activeConversation.conversation_id === conversationId) {
      setActiveConversation(createNewConversation());
    }

    setOpenMenu(null);
  };

  return (
    <div className={`container ${theme}`}>
      <aside className="sidebar">
        <p className="sidebar-title">Chat History</p>

        <button className="new-chat-btn" onClick={handleNewChat}>
          + New Chat
        </button>

        <div className="conversation-list">
          {conversations.map((conversation) => (
            <div
              key={conversation.conversation_id}
              className={
                conversation.conversation_id === activeConversation.conversation_id
                  ? 'conversation-item active-conversation'
                  : 'conversation-item'
              }
              onClick={() => handleSelectConversation(conversation)}
            >
              <span className="conversation-title">{conversation.title}</span>

              <div className="conversation-menu-wrapper">
                <button 
                className="options-btn"
                onClick={(e) => {
                  e.stopPropagation();

                  const rect = e.currentTarget.getBoundingClientRect();

                  setOpenMenu(
                    openMenu?.id === conversation.conversation_id
                      ? null
                      : {
                          id: conversation.conversation_id,
                          top: rect.bottom + 6,
                          left: rect.left - 120
                        }
                  );
                }}
              >
                ⋮
              </button>

                {openMenu?.id === conversation.conversation_id && (
                <div
                  className="conversation-dropdown"
                  style={{
                    top: `${openMenu.top}px`,
                    left: `${openMenu.left}px`
                  }}
                >
                    <button
                      onClick={(e) =>
                        handleClearConversation(conversation.conversation_id, e)
                      }
                    >
                      Clear Chat
                    </button>

                    <button
                      onClick={(e) =>
                        handleDeleteConversation(conversation.conversation_id, e)
                      }
                    >
                      Delete Chat
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="main-content">
        <header className="chat-header">
          <h1>UTSA GPT</h1>

          <button className="theme-toggle" onClick={toggleTheme}>
            💡
          </button>
        </header>

        <section className="chat-window">
          {activeConversation.History.length === 0 ? (
            <div className="welcome-message">
              <h2>How can I help you today?</h2>
              <p>Ask a question to start a new conversation.</p>
            </div>
          ) : (
            activeConversation.History.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === 'user'
                    ? 'message user-message'
                    : 'message bot-message'
                }
              >
                <p>{message.content}</p>

                {message.role === 'bot' &&
                  message.sources &&
                  message.sources.length > 0 && (
                    <div className="sources">
                      <small>Sources:</small>
                      <ul>
                        {message.sources.map((source, i) => (
                          <li key={i}>
                            <small>{source}</small>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="message bot-message">
              <p>Thinking...</p>
            </div>
          )}

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