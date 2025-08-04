import React, { useState, useEffect } from "react";
import Login from "./Login";
import Room from "./Room";
import { getToken, removeToken } from "../utils/auth";
import jwtDecode from "jwt-decode";

const App = () => {
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUsername(decoded.username || "User");
      } catch {
        removeToken();
      }
    }
  }, []);

  const handleLogout = () => {
    removeToken();
    setUsername(null);
  };

  return username ? (
    <Room username={username} onLogout={handleLogout} />
  ) : (
    <Login onLoginSuccess={setUsername} />
  );
};

export default App;
