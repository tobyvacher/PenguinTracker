import { createContext, useState, useContext, useEffect, ReactNode } from "react";

type Theme = "dark" | "light";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Initialize theme from localStorage or use system default
  const [theme, setTheme] = useState<Theme>(() => {
    // Check if theme is stored in localStorage
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    if (storedTheme) return storedTheme;
    
    // Default to dark theme if no preference is saved
    return "dark";
  });

  // Apply theme effect
  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === "dark";

    // Toggle the "dark" class on the html element
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};