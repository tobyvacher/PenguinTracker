import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Toggle } from "@/components/ui/toggle";

interface ThemeToggleProps {
  variant?: "button" | "toggle";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export default function ThemeToggle({ 
  variant = "button", 
  size = "default",
  className = ""
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  if (variant === "toggle") {
    return (
      <Toggle
        pressed={isDark}
        onPressedChange={toggleTheme}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
        className={className}
      >
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </Toggle>
    );
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={toggleTheme}
      className={`rounded-full ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}