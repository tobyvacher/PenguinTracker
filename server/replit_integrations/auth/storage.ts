import { users } from "@shared/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";

export interface IAuthStorage {
  upsertUser(profile: {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    profileImageUrl?: string | null;
  }): Promise<typeof users.$inferSelect>;
  getUser(replitUserId: string): Promise<typeof users.$inferSelect | undefined>;
}

class AuthStorage implements IAuthStorage {
  async upsertUser(profile: {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    profileImageUrl?: string | null;
  }): Promise<typeof users.$inferSelect> {
    const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || null;
    const [existing] = await db.select().from(users).where(eq(users.replitUserId, profile.id));
    if (existing) {
      const [updated] = await db
        .update(users)
        .set({
          displayName,
          email: profile.email ?? null,
          photoURL: profile.profileImageUrl ?? null,
        })
        .where(eq(users.replitUserId, profile.id))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(users)
      .values({
        replitUserId: profile.id,
        displayName,
        email: profile.email ?? null,
        photoURL: profile.profileImageUrl ?? null,
      })
      .returning();
    return created;
  }

  async getUser(replitUserId: string): Promise<typeof users.$inferSelect | undefined> {
    const [user] = await db.select().from(users).where(eq(users.replitUserId, replitUserId));
    return user;
  }
}

export const authStorage = new AuthStorage();
