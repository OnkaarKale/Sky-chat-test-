import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";

export default function Home() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);

  const currentUser = auth.user?.profile.email;

  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const fetchUsers = async () => {
      try {
        const res = await fetch(
          "https://uqtbl5jiaf.execute-api.us-east-1.amazonaws.com/prod/users"
        );
        const data = await res.json();

        // Handle the case where body is a stringified JSON
        let usersList = [];
        if (typeof data.body === "string") {
          usersList = JSON.parse(data.body);
        } else if (Array.isArray(data.body)) {
          usersList = data.body;
        }

        // Filter out current user
        usersList = usersList.filter(u => u.email !== currentUser);

        setUsers(usersList);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };

    fetchUsers();
  }, [auth.isAuthenticated, currentUser]);

  const handleLogout = () => {
    auth.removeUser();
    navigate("/");
  };

  const goToChat = (userEmail) => {
    navigate(`/chat/${userEmail}`);
  };

  if (!auth.isAuthenticated) return <div>Please login</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Welcome, {currentUser}</h2>
      <button onClick={handleLogout} style={{ padding: "10px", marginBottom: "20px" }}>
        Logout
      </button>

      <h3>Other Users:</h3>
      {users.length === 0 ? (
        <p>No other users found.</p>
      ) : (
        <ul>
          {users.map((u, idx) => (
            <li key={idx} style={{ marginBottom: "10px" }}>
              {u.email}{" "}
              <button onClick={() => goToChat(u.email)} style={{ marginLeft: "10px" }}>
                Chat
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
