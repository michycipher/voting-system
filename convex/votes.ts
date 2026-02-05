import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Cast multiple votes at once
export const castVotes = mutation({
  args: {
    voterCode: v.string(),
    votes: v.array(
      v.object({
        candidateId: v.id("candidates"),
        position: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Verify voter exists and hasn't voted
    const voter = await ctx.db
      .query("voters")
      .withIndex("by_code", (q) => q.eq("uniqueCode", args.voterCode))
      .first();

    if (!voter) {
      throw new Error("Invalid voter code");
    }

    if (voter.hasVoted) {
      throw new Error("You have already voted");
    }

    // Check if voting is enabled
    const votingEnabledSetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "votingEnabled"))
      .first();

    if (!votingEnabledSetting || !votingEnabledSetting.value) {
      throw new Error("Voting is currently disabled");
    }

    // Process all votes
    const voteRecords = [];
    
    for (const vote of args.votes) {
      // Verify candidate exists
      const candidate = await ctx.db.get(vote.candidateId);
      if (!candidate) {
        throw new Error(`Invalid candidate: ${vote.candidateId}`);
      }

      // Verify candidate is for the correct position
      if (candidate.position !== vote.position) {
        throw new Error(`Candidate ${candidate.firstName} ${candidate.surname} is not running for ${vote.position}`);
      }

      // Increment candidate vote count
      await ctx.db.patch(vote.candidateId, {
        voteCount: candidate.voteCount + 1,
      });

      // Record vote for audit trail
      await ctx.db.insert("votes", {
        voterCode: args.voterCode,
        candidateId: vote.candidateId,
        candidateName: `${candidate.firstName} ${candidate.surname}`,
        position: candidate.position,
        timestamp: Date.now(),
        voterName: `${voter.firstName} ${voter.surname}`,
      });

      voteRecords.push({
        candidateName: `${candidate.firstName} ${candidate.surname}`,
        position: candidate.position,
      });

      // Create audit log for each vote
      await ctx.db.insert("auditLogs", {
        action: "CAST_VOTE",
        performedBy: args.voterCode,
        details: `Vote cast for ${candidate.firstName} ${candidate.surname} (${candidate.position})`,
        timestamp: Date.now(),
        category: "vote",
      });
    }

    // Mark voter as having voted (only after all votes are successful)
    await ctx.db.patch(voter._id, {
      hasVoted: true,
      votedAt: Date.now(),
    });

    return { 
      success: true,
      votesCount: voteRecords.length,
      votes: voteRecords 
    };
  },
});

// Keep the old castVote for backward compatibility (single vote)
export const castVote = mutation({
  args: {
    voterCode: v.string(),
    candidateId: v.id("candidates"),
  },
  handler: async (ctx, args) => {
    // Verify voter exists
    const voter = await ctx.db
      .query("voters")
      .withIndex("by_code", (q) => q.eq("uniqueCode", args.voterCode))
      .first();

    if (!voter) {
      throw new Error("Invalid voter code");
    }

    if (voter.hasVoted) {
      throw new Error("You have already voted");
    }

    // Check if voting is enabled
    const votingEnabledSetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "votingEnabled"))
      .first();

    if (!votingEnabledSetting || !votingEnabledSetting.value) {
      throw new Error("Voting is currently disabled");
    }

    // Verify candidate exists
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) {
      throw new Error("Invalid candidate");
    }

    // Update voter status
    await ctx.db.patch(voter._id, {
      hasVoted: true,
      votedAt: Date.now(),
    });

    // Increment candidate vote count
    await ctx.db.patch(args.candidateId, {
      voteCount: candidate.voteCount + 1,
    });

    // Record vote for audit trail
    await ctx.db.insert("votes", {
      voterCode: args.voterCode,
      candidateId: args.candidateId,
      candidateName: `${candidate.firstName} ${candidate.surname}`,
      position: candidate.position,
      timestamp: Date.now(),
      voterName: `${voter.firstName} ${voter.surname}`,
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "CAST_VOTE",
      performedBy: args.voterCode,
      details: `Vote cast for ${candidate.firstName} ${candidate.surname} (${candidate.position})`,
      timestamp: Date.now(),
      category: "vote",
    });

    return { success: true };
  },
});

// Get all votes (for admin)
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("votes").order("desc").collect();
  },
});

// Get votes by position
export const getByPosition = query({
  args: { position: v.string() },
  handler: async (ctx, args) => {
    const votes = await ctx.db.query("votes").collect();
    return votes.filter((v) => v.position === args.position);
  },
});

// Get real-time results
export const getResults = query({
  handler: async (ctx) => {
    const candidates = await ctx.db.query("candidates").collect();
    const positions = [...new Set(candidates.map((c) => c.position))];

    const results = positions.map((position) => {
      const positionCandidates = candidates
        .filter((c) => c.position === position)
        .sort((a, b) => b.voteCount - a.voteCount);

      const totalVotes = positionCandidates.reduce(
        (sum, c) => sum + c.voteCount,
        0
      );

      return {
        position,
        candidates: positionCandidates.map((c) => ({
          id: c._id,
          name: `${c.title} ${c.firstName} ${c.surname}`,
          voteCount: c.voteCount,
          percentage: totalVotes > 0 ? (c.voteCount / totalVotes) * 100 : 0,
          imageUrl: c.imageUrl,
        })),
        totalVotes,
      };
    });

    return results;
  },
});

// Get detailed results with voter information
export const getDetailedResults = query({
  handler: async (ctx) => {
    const votes = await ctx.db.query("votes").order("desc").collect();
    const candidates = await ctx.db.query("candidates").collect();
    const voters = await ctx.db.query("voters").collect();

    const totalVoters = voters.length;
    const votedCount = voters.filter((v) => v.hasVoted).length;

    return {
      votes,
      candidates,
      totalVoters,
      votedCount,
      turnoutPercentage: totalVoters > 0 ? (votedCount / totalVoters) * 100 : 0,
    };
  },
});


// import { v } from "convex/values";
// import { mutation, query } from "./_generated/server";

// // Cast a vote
// export const castVote = mutation({
//   args: {
//     voterCode: v.string(),
//     candidateId: v.id("candidates"),
//   },
//   handler: async (ctx, args) => {
//     // Verify voter exists and hasn't voted
//     const voter = await ctx.db
//       .query("voters")
//       .withIndex("by_code", (q) => q.eq("uniqueCode", args.voterCode))
//       .first();

//     if (!voter) {
//       throw new Error("Invalid voter code");
//     }

//     if (voter.hasVoted) {
//       throw new Error("You have already voted");
//     }

//     // Check if voting is enabled
//     const votingEnabled = await ctx.db
//       .query("settings")
//       .withIndex("by_key", (q) => q.eq("key", "votingEnabled"))
//       .first();

//     if (!votingEnabled || !votingEnabled.value) {
//       throw new Error("Voting is currently disabled");
//     }

//     // Verify candidate exists
//     const candidate = await ctx.db.get(args.candidateId);
//     if (!candidate) {
//       throw new Error("Invalid candidate");
//     }

//     // Update voter status
//     await ctx.db.patch(voter._id, {
//       hasVoted: true,
//       votedAt: Date.now(),
//     });

//     // Increment candidate vote count
//     await ctx.db.patch(args.candidateId, {
//       voteCount: candidate.voteCount + 1,
//     });

//     // Record vote for audit trail
//     await ctx.db.insert("votes", {
//       voterCode: args.voterCode,
//       candidateId: args.candidateId,
//       candidateName: `${candidate.firstName} ${candidate.surname}`,
//       position: candidate.position,
//       timestamp: Date.now(),
//       voterName: `${voter.firstName} ${voter.surname}`,
//     });

//     // Create audit log
//     await ctx.db.insert("auditLogs", {
//       action: "CAST_VOTE",
//       performedBy: args.voterCode,
//       details: `Vote cast for ${candidate.firstName} ${candidate.surname} (${candidate.position})`,
//       timestamp: Date.now(),
//       category: "vote",
//     });

//     return { success: true };
//   },
// });

// // Get all votes (for admin)
// export const list = query({
//   handler: async (ctx) => {
//     return await ctx.db.query("votes").order("desc").collect();
//   },
// });

// // Get votes by position
// export const getByPosition = query({
//   args: { position: v.string() },
//   handler: async (ctx, args) => {
//     const votes = await ctx.db.query("votes").collect();
//     return votes.filter((v) => v.position === args.position);
//   },
// });

// // Get real-time results
// export const getResults = query({
//   handler: async (ctx) => {
//     const candidates = await ctx.db.query("candidates").collect();
//     const positions = [...new Set(candidates.map((c) => c.position))];

//     const results = positions.map((position) => {
//       const positionCandidates = candidates
//         .filter((c) => c.position === position)
//         .sort((a, b) => b.voteCount - a.voteCount);

//       const totalVotes = positionCandidates.reduce(
//         (sum, c) => sum + c.voteCount,
//         0
//       );

//       return {
//         position,
//         candidates: positionCandidates.map((c) => ({
//           id: c._id,
//           name: `${c.title} ${c.firstName} ${c.surname}`,
//           voteCount: c.voteCount,
//           percentage: totalVotes > 0 ? (c.voteCount / totalVotes) * 100 : 0,
//           imageUrl: c.imageUrl,
//         })),
//         totalVotes,
//       };
//     });

//     return results;
//   },
// });

// // Get detailed results with voter information
// export const getDetailedResults = query({
//   handler: async (ctx) => {
//     const votes = await ctx.db.query("votes").order("desc").collect();
//     const candidates = await ctx.db.query("candidates").collect();
//     const voters = await ctx.db.query("voters").collect();

//     const totalVoters = voters.length;
//     const votedCount = voters.filter((v) => v.hasVoted).length;

//     return {
//       votes,
//       candidates,
//       totalVoters,
//       votedCount,
//       turnoutPercentage: totalVoters > 0 ? (votedCount / totalVoters) * 100 : 0,
//     };
//   },
// });

