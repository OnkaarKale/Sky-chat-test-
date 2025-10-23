import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "react-oidc-context";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const auth = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth.isAuthenticated) {
      fetch("https://uqtbl5jiaf.execute-api.us-east-1.amazonaws.com/prod/users")
        .then((res) => res.json())
        .then((data) => {
          setUsers(JSON.parse(data.body)); // parse body string
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [auth.isAuthenticated]);

  return (
    <UserContext.Provider value={{ users, setUsers, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUsers = () => useContext(UserContext);
