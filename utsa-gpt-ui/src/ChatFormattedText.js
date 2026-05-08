import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

/**
 * Normalizes LLM-style text: **bold**, *italic*, and inline bullets so markdown
 * can render lists, line breaks, and emphasis consistently.
 */
export function preprocessChatMarkdown(text) {
  if (text == null || text === '') return '';
  let s = String(text).replace(/\r\n/g, '\n');

  // Inline bullets like " * **Label:**" → block list item
  s = s.replace(/\s+\*\s+(\*\*)/g, '\n\n* $1');

  // Paragraph break before headings such as **Reasoning for Decision:**
  s = s.replace(/(\.)\s+(\*\*[^*\n]+:\*\*)/g, '$1\n\n$2');

  // Inline "* If ..." / "* Another ..." bullets after a period
  s = s.replace(/(\.)\s+\*\s+(If\b)/g, '$1\n\n* $2');
  s = s.replace(/(\.)\s+\*\s+(Another\b)/g, '$1\n\n* $2');

  return s;
}

export function ChatFormattedText({ children }) {
  const raw = preprocessChatMarkdown(children ?? '');

  return (
    <div className="chat-message-body">
      <ReactMarkdown remarkPlugins={[remarkBreaks]}>{raw}</ReactMarkdown>
    </div>
  );
}
