import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "react-oidc-context";

export default function Chat() {
  const { username } = useParams(); // recipient
  const auth = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const ws = useRef(null);

  const currentUser = auth.user?.profile.email;

  useEffect(() => {
    if (!auth.isAuthenticated || !currentUser) return;

    ws.current = new WebSocket(
      `wss://i4chkfla0f.execute-api.us-east-1.amazonaws.com/production/?userId=${currentUser}`
    );

    ws.current.onopen = () => {
      console.log("✅ Connected to WebSocket");
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Only show messages where currentUser is sender or receiver
      if (
        (data.sender === currentUser && data.receiver === username) || 
        (data.sender === username && data.receiver === currentUser)
      ) {
        setMessages((prev) => [...prev, data]);
      }
    };

    ws.current.onclose = () => {
      console.log("❌ Disconnected from WebSocket");
    };

    ws.current.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => ws.current?.close();
  }, [auth.isAuthenticated, currentUser, username]);

  const sendMessage = () => {
    if (!input || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    const payload = {
      sender: currentUser,
      receiver: username,
      message: input,
    };

    ws.current.send(JSON.stringify(payload));
    setMessages((prev) => [...prev, payload]); // Optimistically show sent message
    setInput("");
  };

  if (!auth.isAuthenticated) return <div>Please login</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Chat with {username}</h2>
      <div
        style={{
          border: "1px solid #ccc",
          height: "300px",
          overflowY: "scroll",
          padding: "10px",
        }}
      >
        {messages.map((m, idx) => (
          <div key={idx}>
            <strong>{m.sender}:</strong> {m.message} <em>{m.time || ""}</em>
          </div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message"
        style={{ width: "80%", padding: "10px", marginTop: "10px" }}
      />
      <button onClick={sendMessage} style={{ padding: "10px", marginLeft: "5px" }}>
        Send
      </button>
    </div>
  );
}
