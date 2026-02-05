import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all candidates
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("candidates").order("desc").collect();
  },
});

// Get candidates by position
export const getByPosition = query({
  args: { position: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("candidates")
      .withIndex("by_position", (q) => q.eq("position", args.position))
      .collect();
  },
});

// Get all unique positions
export const getPositions = query({
  handler: async (ctx) => {
    const candidates = await ctx.db.query("candidates").collect();
    const positions = [...new Set(candidates.map((c) => c.position))];
    return positions.sort();
  },
});

// Add a candidate
export const add = mutation({
  args: {
    title: v.string(),
    firstName: v.string(),
    middleName: v.optional(v.string()),
    surname: v.string(),
    position: v.string(),
    imageUrl: v.optional(v.string()),
    biography: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const candidateId = await ctx.db.insert("candidates", {
      ...args,
      voteCount: 0,
      createdAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "CREATE_CANDIDATE",
      performedBy: "admin",
      details: `Added candidate: ${args.firstName} ${args.surname} for ${args.position}`,
      timestamp: Date.now(),
      category: "candidate",
    });

    return candidateId;
  },
});

// Update a candidate
export const update = mutation({
  args: {
    id: v.id("candidates"),
    title: v.string(),
    firstName: v.string(),
    middleName: v.optional(v.string()),
    surname: v.string(),
    position: v.string(),
    imageUrl: v.optional(v.string()),
    biography: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "UPDATE_CANDIDATE",
      performedBy: "admin",
      details: `Updated candidate: ${args.firstName} ${args.surname}`,
      timestamp: Date.now(),
      category: "candidate",
    });

    return id;
  },
});

// Delete a candidate
export const remove = mutation({
  args: { id: v.id("candidates") },
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.id);
    if (!candidate) throw new Error("Candidate not found");

    await ctx.db.delete(args.id);

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "DELETE_CANDIDATE",
      performedBy: "admin",
      details: `Deleted candidate: ${candidate.firstName} ${candidate.surname}`,
      timestamp: Date.now(),
      category: "candidate",
    });
  },
});

// Get candidate statistics
export const getStats = query({
  handler: async (ctx) => {
    const candidates = await ctx.db.query("candidates").collect();
    const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);
    
    const positions = [...new Set(candidates.map((c) => c.position))];
    const byPosition = positions.map((position) => {
      const positionCandidates = candidates.filter((c) => c.position === position);
      const positionVotes = positionCandidates.reduce((sum, c) => sum + c.voteCount, 0);
      return {
        position,
        candidateCount: positionCandidates.length,
        totalVotes: positionVotes,
      };
    });

    return {
      totalCandidates: candidates.length,
      totalVotes,
      positionCount: positions.length,
      byPosition,
    };
  },
});