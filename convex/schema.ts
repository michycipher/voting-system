import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Candidates table
  candidates: defineTable({
    title: v.string(),
    firstName: v.string(),
    middleName: v.optional(v.string()),
    surname: v.string(),
    position: v.string(),
    imageUrl: v.optional(v.string()),
    biography: v.optional(v.string()),
    voteCount: v.number(),
    createdAt: v.number(),
  }).index("by_position", ["position"]),

  // Voters table
  voters: defineTable({
    uniqueCode: v.string(),
    title: v.string(),
    firstName: v.string(),
    middleName: v.optional(v.string()),
    surname: v.string(),
    gender: v.string(),
    hasVoted: v.boolean(),
    votedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_code", ["uniqueCode"])
    .index("by_voted_status", ["hasVoted"]),

  // Votes table (for audit trail)
  votes: defineTable({
    voterCode: v.string(),
    candidateId: v.id("candidates"),
    candidateName: v.string(),
    position: v.string(),
    timestamp: v.number(),
    voterName: v.string(),
  }).index("by_voter", ["voterCode"])
    .index("by_candidate", ["candidateId"])
    .index("by_timestamp", ["timestamp"]),

  // Settings table
  settings: defineTable({
    key: v.string(),
    value: v.any(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // Audit logs
  auditLogs: defineTable({
    action: v.string(),
    performedBy: v.string(),
    details: v.string(),
    timestamp: v.number(),
    category: v.string(), // "voter", "candidate", "vote", "system"
  }).index("by_timestamp", ["timestamp"])
    .index("by_category", ["category"]),
});