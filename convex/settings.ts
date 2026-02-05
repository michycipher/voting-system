import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get a setting by key
export const get = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
  },
});

// Get all settings
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("settings").collect();
  },
});

// Set a setting
export const set = mutation({
  args: {
    key: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt: Date.now(),
      });

      // Create audit log
      await ctx.db.insert("auditLogs", {
        action: "UPDATE_SETTING",
        performedBy: "admin",
        details: `Updated setting: ${args.key} = ${JSON.stringify(args.value)}`,
        timestamp: Date.now(),
        category: "system",
      });

      return existing._id;
    } else {
      const id = await ctx.db.insert("settings", {
        key: args.key,
        value: args.value,
        updatedAt: Date.now(),
      });

      // Create audit log
      await ctx.db.insert("auditLogs", {
        action: "CREATE_SETTING",
        performedBy: "admin",
        details: `Created setting: ${args.key} = ${JSON.stringify(args.value)}`,
        timestamp: Date.now(),
        category: "system",
      });

      return id;
    }
  },
});

// Initialize default settings
export const initialize = mutation({
  handler: async (ctx) => {
    const votingEnabled = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "votingEnabled"))
      .first();

    if (!votingEnabled) {
      await ctx.db.insert("settings", {
        key: "votingEnabled",
        value: false,
        updatedAt: Date.now(),
      });
    }

    const electionTitle = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "electionTitle"))
      .first();

    if (!electionTitle) {
      await ctx.db.insert("settings", {
        key: "electionTitle",
        value: "General Election",
        updatedAt: Date.now(),
      });
    }

    const maxCandidatesPerPosition = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "maxCandidatesPerPosition"))
      .first();

    if (!maxCandidatesPerPosition) {
      await ctx.db.insert("settings", {
        key: "maxCandidatesPerPosition",
        value: 20,
        updatedAt: Date.now(),
      });
    }
  },
});