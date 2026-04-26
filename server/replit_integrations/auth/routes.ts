import type { Express, Request } from "express";
import { authStorage } from "./storage";
import { isAuthenticated, type ReplitAuthUser } from "./replitAuth";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: Request, res) => {
    try {
      const sessionUser = req.user as ReplitAuthUser | undefined;
      const userId = sessionUser?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await authStorage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
