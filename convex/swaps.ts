import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get incoming swap requests
export const getIncomingRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const requests = await ctx.db
      .query("swapRequests")
      .withIndex("by_target", (q) => q.eq("targetUserId", userId))
      .collect();

    return await Promise.all(
      requests.map(async (request) => {
        const requester = await ctx.db.get(request.requesterId);
        const requesterSlot = await ctx.db.get(request.requesterSlotId);
        const targetSlot = await ctx.db.get(request.targetSlotId);

        return {
          ...request,
          requesterName: requester?.name || requester?.email || "Unknown User",
          requesterSlot,
          targetSlot,
        };
      })
    );
  },
});

// Get outgoing swap requests
export const getOutgoingRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const requests = await ctx.db
      .query("swapRequests")
      .withIndex("by_requester", (q) => q.eq("requesterId", userId))
      .collect();

    return await Promise.all(
      requests.map(async (request) => {
        const targetUser = await ctx.db.get(request.targetUserId);
        const requesterSlot = await ctx.db.get(request.requesterSlotId);
        const targetSlot = await ctx.db.get(request.targetSlotId);

        return {
          ...request,
          targetUserName: targetUser?.name || targetUser?.email || "Unknown User",
          requesterSlot,
          targetSlot,
        };
      })
    );
  },
});

// Create swap request
export const createSwapRequest = mutation({
  args: {
    mySlotId: v.id("events"),
    theirSlotId: v.id("events"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify both slots exist and are swappable
    const mySlot = await ctx.db.get(args.mySlotId);
    const theirSlot = await ctx.db.get(args.theirSlotId);

    if (!mySlot || mySlot.userId !== userId) {
      throw new Error("Your slot not found or not authorized");
    }

    if (!theirSlot || theirSlot.userId === userId) {
      throw new Error("Target slot not found or is your own slot");
    }

    if (mySlot.status !== "SWAPPABLE") {
      throw new Error("Your slot is not swappable");
    }

    if (theirSlot.status !== "SWAPPABLE") {
      throw new Error("Target slot is not swappable");
    }

    // Check for existing pending request
    const existingRequest = await ctx.db
      .query("swapRequests")
      .filter((q) =>
        q.and(
          q.eq(q.field("requesterSlotId"), args.mySlotId),
          q.eq(q.field("targetSlotId"), args.theirSlotId),
          q.eq(q.field("status"), "PENDING")
        )
      )
      .first();

    if (existingRequest) {
      throw new Error("Swap request already exists");
    }

    // Create swap request
    const requestId = await ctx.db.insert("swapRequests", {
      requesterId: userId,
      targetUserId: theirSlot.userId,
      requesterSlotId: args.mySlotId,
      targetSlotId: args.theirSlotId,
      status: "PENDING",
      message: args.message,
    });

    // Update both slots to SWAP_PENDING
    await ctx.db.patch(args.mySlotId, { status: "SWAP_PENDING" });
    await ctx.db.patch(args.theirSlotId, { status: "SWAP_PENDING" });

    return requestId;
  },
});

// Respond to swap request
export const respondToSwapRequest = mutation({
  args: {
    requestId: v.id("swapRequests"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request || request.targetUserId !== userId) {
      throw new Error("Swap request not found or not authorized");
    }

    if (request.status !== "PENDING") {
      throw new Error("Swap request is not pending");
    }

    const requesterSlot = await ctx.db.get(request.requesterSlotId);
    const targetSlot = await ctx.db.get(request.targetSlotId);

    if (!requesterSlot || !targetSlot) {
      throw new Error("One or both slots no longer exist");
    }

    if (args.accept) {
      // Accept the swap - exchange ownership
      await ctx.db.patch(request.requesterSlotId, {
        userId: request.targetUserId,
        status: "BUSY",
      });
      await ctx.db.patch(request.targetSlotId, {
        userId: request.requesterId,
        status: "BUSY",
      });
      await ctx.db.patch(args.requestId, { status: "ACCEPTED" });
    } else {
      // Reject the swap - revert to swappable
      await ctx.db.patch(request.requesterSlotId, { status: "SWAPPABLE" });
      await ctx.db.patch(request.targetSlotId, { status: "SWAPPABLE" });
      await ctx.db.patch(args.requestId, { status: "REJECTED" });
    }

    return { success: true };
  },
});
