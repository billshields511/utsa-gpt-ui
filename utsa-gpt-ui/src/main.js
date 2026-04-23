// Load messages
const loadMessages = () => {
  const stored = localStorage.getItem('messages');
  return stored ? JSON.parse(stored) : [];
};

// Save messages
const saveMessages = (messages) => {
  localStorage.setItem('messages', JSON.stringify(messages));
};

export { loadMessages, saveMessages };
