import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "react-oidc-context";

export default function Chat() {
  const { username } = useParams(); // recipient
  const auth = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  const currentUser = auth.user?.profile.email;

  // Scroll to bottom whenever messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Fetch old messages from DynamoDB via API Gateway
  const fetchOldMessages = async () => {
    if (!currentUser || !username) return;

    try {
      const response = await fetch(
        "https://wdroeztcs7.execute-api.us-east-1.amazonaws.com/dev/getMessages",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sender: currentUser, receiver: username }),
        }
      );

      const raw = await response.json();
      let data = [];
      if (raw.body) {
        try {
          data = JSON.parse(raw.body);
        } catch {
          console.error("Failed to parse body");
        }
      }

      if (Array.isArray(data)) {
        data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(data);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  // Setup WebSocket for SkyChat
  useEffect(() => {
    if (!auth.isAuthenticated || !currentUser) return;

    fetchOldMessages();

    ws.current = new WebSocket(
      `wss://i4chkfla0f.execute-api.us-east-1.amazonaws.com/production/?userId=${currentUser}`
    );

    ws.current.onopen = () => console.log("Connected to SkyChat WebSocket");

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (
        (data.sender === currentUser && data.receiver === username) ||
        (data.sender === username && data.receiver === currentUser)
      ) {
        setMessages((prev) => [...prev, data]);
      }
    };

    ws.current.onclose = () => console.log("WebSocket disconnected");
    ws.current.onerror = (err) => console.error("WebSocket error:", err);

    return () => ws.current?.close();
  }, [auth.isAuthenticated, currentUser, username]);

  const sendMessage = () => {
    if (!input.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    const payload = {
      sender: currentUser,
      receiver: username,
      message: input,
      timestamp: new Date().toISOString(),
    };

    ws.current.send(JSON.stringify(payload));
    setMessages((prev) => [...prev, payload]);
    setInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  if (!auth.isAuthenticated) return <div>Please login</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Chat with {username}</h2>

      <div
        style={{
          border: "1px solid #ccc",
          height: "400px",
          overflowY: "auto",
          padding: "10px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.map((m, idx) => {
          const isOwn = m.sender === currentUser;
          return (
            <div
              key={idx}
              style={{
                alignSelf: isOwn ? "flex-end" : "flex-start",
                background: isOwn ? "#daf1da" : "#f1f1f1",
                padding: "8px 12px",
                borderRadius: "12px",
                margin: "4px 0",
                maxWidth: "80%",
                wordBreak: "break-word",
              }}
            >
              {!isOwn && <strong>{m.sender}:</strong>} {m.message}
              <div style={{ fontSize: "0.7em", textAlign: "right" }}>
                {m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : ""}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: "flex", marginTop: "10px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message"
          style={{ flex: 1, padding: "10px" }}
        />
        <button onClick={sendMessage} style={{ padding: "10px 15px", marginLeft: "5px" }}>
          Send
        </button>
      </div>
    </div>
  );
}
