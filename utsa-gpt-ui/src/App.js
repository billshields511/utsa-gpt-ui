import './App.css';

function App() {
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
          <p>User prompt</p>
          <p>Chatbot's response</p>
        </section>

        <footer className="chat-input">
          <input type="text" placeholder="Type a message..." />
        </footer>
      </main>
    </div>
  );
}

export default App;