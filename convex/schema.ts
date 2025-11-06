import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  events: defineTable({
    title: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    status: v.union(v.literal("BUSY"), v.literal("SWAPPABLE"), v.literal("SWAP_PENDING")),
    userId: v.id("users"),
    description: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_and_status", ["userId", "status"]),

  swapRequests: defineTable({
    requesterId: v.id("users"),
    targetUserId: v.id("users"),
    requesterSlotId: v.id("events"),
    targetSlotId: v.id("events"),
    status: v.union(v.literal("PENDING"), v.literal("ACCEPTED"), v.literal("REJECTED")),
    message: v.optional(v.string()),
  })
    .index("by_requester", ["requesterId"])
    .index("by_target", ["targetUserId"])
    .index("by_status", ["status"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
