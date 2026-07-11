import { useState, useRef, useEffect } from "react";
import axios from "../api/axios";
import "../styles/FloatingChatbot.css";

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      content: "Hello! I am LegalAssist-AI. How can I help you with your legal queries today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await axios.post("/api/contracts/general-chat", {
        question: userMessage,
        history: messages.map((m) => ({
          role: m.role === "bot" ? "assistant" : "user",
          content: m.content,
        })),
      });

      if (response.data.success) {
        setMessages((prev) => [...prev, { role: "bot", content: response.data.response }]);
      } else {
        throw new Error(response.data.message || "Failed to get response");
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Sorry, I'm having trouble connecting right now." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`floating-chatbot-container ${isOpen ? "open" : ""}`}>
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="header-info">
              <i className="fas fa-robot"></i>
              <span>LegalAssist-AI</span>
            </div>
            <button onClick={toggleChat} className="close-btn">
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <div className="message-bubble">{msg.content}</div>
              </div>
            ))}
            {isLoading && (
              <div className="message bot">
                <div className="message-bubble loading">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chatbot-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask a legal question..."
            />
            <button onClick={handleSend} disabled={isLoading}>
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}
      <button className="chatbot-toggle-btn" onClick={toggleChat}>
        {isOpen ? <i className="fas fa-comment-slash"></i> : <i className="fas fa-comment-dots"></i>}
      </button>
    </div>
  );
};

export default FloatingChatbot;
