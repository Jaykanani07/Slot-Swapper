import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get user's own events
export const getUserEvents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Get all swappable slots from other users
export const getSwappableSlots = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const swappableEvents = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "SWAPPABLE"))
      .collect();

    // Filter out current user's events and add user info
    const slotsWithUsers = await Promise.all(
      swappableEvents
        .filter((event) => event.userId !== userId)
        .map(async (event) => {
          const user = await ctx.db.get(event.userId);
          return {
            ...event,
            ownerName: user?.name || user?.email || "Unknown User",
          };
        })
    );

    return slotsWithUsers;
  },
});

// Create a new event
export const createEvent = mutation({
  args: {
    title: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("events", {
      ...args,
      userId,
      status: "BUSY",
    });
  },
});

// Update event status
export const updateEventStatus = mutation({
  args: {
    eventId: v.id("events"),
    status: v.union(v.literal("BUSY"), v.literal("SWAPPABLE")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== userId) {
      throw new Error("Event not found or not authorized");
    }

    if (event.status === "SWAP_PENDING") {
      throw new Error("Cannot modify event with pending swap");
    }

    await ctx.db.patch(args.eventId, { status: args.status });
  },
});

// Delete event
export const deleteEvent = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== userId) {
      throw new Error("Event not found or not authorized");
    }

    if (event.status === "SWAP_PENDING") {
      throw new Error("Cannot delete event with pending swap");
    }

    await ctx.db.delete(args.eventId);
  },
});
