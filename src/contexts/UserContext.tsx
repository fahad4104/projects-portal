"use client";

import { createContext, useContext, useEffect, useState } from "react";

type User = {
  id?: string;
  name?: string;
  email?: string;
} | null;

type UserContextValue = {
  user: User;
  setUser: (user: User) => void;
  logout: () => void;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pp_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed) {
            setUserState(parsed);
          }
        } catch {
          localStorage.removeItem("pp_user");
        }
      }
    }
  }, []);

  const setUser = (user: User) => {
    setUserState(user);
    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem("pp_user", JSON.stringify(user));
      } else {
        localStorage.removeItem("pp_user");
      }
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useCurrentUser must be used inside UserProvider");
  }
  return ctx;
}
