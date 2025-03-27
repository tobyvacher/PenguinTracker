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
      variant={isDark ? "outline" : "default"}
      size={size}
      onClick={toggleTheme}
      className={`rounded-full ${className} ${!isDark ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-200 shadow-sm' : 'border border-gray-600'}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-300" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}