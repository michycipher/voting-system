import { v } from "convex/values";
import { query } from "./_generated/server";

// Get all audit logs
export const list = query({
  args: {
    limit: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("auditLogs").order("desc");

    if (args.category !== undefined) {
      query = ctx.db
        .query("auditLogs")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .order("desc");
    }

    const logs = await query.collect();

    if (args.limit) {
      return logs.slice(0, args.limit);
    }

    return logs;
  },
});

// Get audit logs by date range
export const getByDateRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let logs = await ctx.db.query("auditLogs").order("desc").collect();

    logs = logs.filter(
      (log) => log.timestamp >= args.startDate && log.timestamp <= args.endDate
    );

    if (args.category) {
      logs = logs.filter((log) => log.category === args.category);
    }

    return logs;
  },
});

// Get audit log statistics
export const getStats = query({
  handler: async (ctx) => {
    const logs = await ctx.db.query("auditLogs").collect();

    const categories = ["voter", "candidate", "vote", "system"];
    const byCategoryCounts = categories.map((category) => ({
      category,
      count: logs.filter((log) => log.category === category).length,
    }));

    // Get activity over time (last 24 hours, grouped by hour)
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const recentLogs = logs.filter((log) => log.timestamp >= oneDayAgo);

    const activityMap = new Map<string, number>();
    recentLogs.forEach((log) => {
      const date = new Date(log.timestamp);
      const hour = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours()
      ).toISOString();
      activityMap.set(hour, (activityMap.get(hour) || 0) + 1);
    });

    const activityOverTime = Array.from(activityMap.entries())
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return {
      totalLogs: logs.length,
      byCategory: byCategoryCounts,
      recentActivity: activityOverTime,
    };
  },
});