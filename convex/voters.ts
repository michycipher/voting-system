import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all voters
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("voters").order("desc").collect();
  },
});

// Get voter by unique code
export const getByCode = query({
  args: { uniqueCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("voters")
      .withIndex("by_code", (q) => q.eq("uniqueCode", args.uniqueCode))
      .first();
  },
});

// Generate unique code
function generateUniqueCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Add a voter
export const add = mutation({
  args: {
    title: v.string(),
    firstName: v.string(),
    middleName: v.optional(v.string()),
    surname: v.string(),
    gender: v.string(),
  },
  handler: async (ctx, args) => {
    // Generate unique code
    let uniqueCode = generateUniqueCode();
    let existing = await ctx.db
      .query("voters")
      .withIndex("by_code", (q) => q.eq("uniqueCode", uniqueCode))
      .first();

    // Keep generating until we get a unique code
    while (existing) {
      uniqueCode = generateUniqueCode();
      existing = await ctx.db
        .query("voters")
        .withIndex("by_code", (q) => q.eq("uniqueCode", uniqueCode))
        .first();
    }

    const voterId = await ctx.db.insert("voters", {
      ...args,
      uniqueCode,
      hasVoted: false,
      createdAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "CREATE_VOTER",
      performedBy: "admin",
      details: `Created voter: ${args.firstName} ${args.surname} with code ${uniqueCode}`,
      timestamp: Date.now(),
      category: "voter",
    });

    return { voterId, uniqueCode };
  },
});

// Bulk add voters
export const bulkAdd = mutation({
  args: {
    voters: v.array(
      v.object({
        title: v.string(),
        firstName: v.string(),
        middleName: v.optional(v.string()),
        surname: v.string(),
        gender: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];

    for (const voter of args.voters) {
      // Generate unique code
      let uniqueCode = generateUniqueCode();
      let existing = await ctx.db
        .query("voters")
        .withIndex("by_code", (q) => q.eq("uniqueCode", uniqueCode))
        .first();

      while (existing) {
        uniqueCode = generateUniqueCode();
        existing = await ctx.db
          .query("voters")
          .withIndex("by_code", (q) => q.eq("uniqueCode", uniqueCode))
          .first();
      }

      const voterId = await ctx.db.insert("voters", {
        ...voter,
        uniqueCode,
        hasVoted: false,
        createdAt: Date.now(),
      });

      results.push({
        voterId,
        uniqueCode,
        name: `${voter.firstName} ${voter.surname}`,
      });
    }

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "BULK_CREATE_VOTERS",
      performedBy: "admin",
      details: `Created ${results.length} voters`,
      timestamp: Date.now(),
      category: "voter",
    });

    return results;
  },
});

// Delete a voter
export const remove = mutation({
  args: { id: v.id("voters") },
  handler: async (ctx, args) => {
    const voter = await ctx.db.get(args.id);
    if (!voter) throw new Error("Voter not found");

    if (voter.hasVoted) {
      throw new Error("Cannot delete a voter who has already voted");
    }

    await ctx.db.delete(args.id);

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "DELETE_VOTER",
      performedBy: "admin",
      details: `Deleted voter: ${voter.firstName} ${voter.surname} (${voter.uniqueCode})`,
      timestamp: Date.now(),
      category: "voter",
    });
  },
});

// Get voter statistics
export const getStats = query({
  handler: async (ctx) => {
    const voters = await ctx.db.query("voters").collect();
    const votedVoters = voters.filter((v) => v.hasVoted);

    return {
      totalVoters: voters.length,
      votedCount: votedVoters.length,
      pendingCount: voters.length - votedVoters.length,
      turnoutPercentage:
        voters.length > 0 ? (votedVoters.length / voters.length) * 100 : 0,
    };
  },
});

// Get voting activity over time
export const getVotingActivity = query({
  handler: async (ctx) => {
    const voters = await ctx.db.query("voters").collect();
    const votedVoters = voters
      .filter((v) => v.hasVoted && v.votedAt)
      .sort((a, b) => a.votedAt! - b.votedAt!);

    // Group by hour
    const activityMap = new Map<string, number>();
    votedVoters.forEach((voter) => {
      const date = new Date(voter.votedAt!);
      const hour = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours()
      ).toISOString();
      activityMap.set(hour, (activityMap.get(hour) || 0) + 1);
    });

    return Array.from(activityMap.entries())
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  },
});