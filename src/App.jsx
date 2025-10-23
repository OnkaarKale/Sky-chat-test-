import { Routes, Route } from "react-router-dom";
import { useAuth } from "react-oidc-context";

import Landing from "./pages/Landing.jsx";
import Home from "./pages/Home.jsx";
import Chat from "./pages/Chat.jsx";
import { UserProvider } from "./context/UserContext.jsx";

export default function App() {
  const auth = useAuth();

  if (auth.isLoading) return <div>Loading...</div>;
  if (auth.error) return <div>Error: {auth.error.message}</div>;

  return (
    <UserProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/home"
          element={auth.isAuthenticated ? <Home /> : <Landing />}
        />
        <Route
          path="/chat/:username"
          element={auth.isAuthenticated ? <Chat /> : <Landing />}
        />
      </Routes>
    </UserProvider>
  );
}
