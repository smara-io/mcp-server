#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { smaraFetch } from "./api-client.js";

const server = new McpServer({
  name: "smara",
  version: "1.0.0",
});

// ── Store a memory ──────────────────────────────────
server.registerTool(
  "store_memory",
  {
    title: "Store Memory",
    description:
      "Store a fact or preference about a user. Smara handles deduplication and contradiction detection automatically. Use importance 0.1-0.3 for trivia, 0.5 for general facts, 0.7-1.0 for critical preferences.",
    inputSchema: {
      user_id: z.string().describe("Unique identifier for the user"),
      fact: z.string().describe("The fact or preference to remember"),
      importance: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .default(0.5)
        .describe("Importance score (0-1). Higher = slower decay."),
    },
  },
  async ({ user_id, fact, importance }) => {
    const data = await smaraFetch("/v1/memories", {
      method: "POST",
      body: JSON.stringify({ user_id, fact, importance }),
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Search memories ─────────────────────────────────
server.registerTool(
  "search_memories",
  {
    title: "Search Memories",
    description:
      "Semantic search across stored memories for a user. Returns results ranked by a blend of vector similarity (70%) and Ebbinghaus decay score (30%). Recent, frequently-accessed memories rank higher.",
    inputSchema: {
      user_id: z.string().describe("User to search memories for"),
      q: z.string().describe("Natural language search query"),
      limit: z
        .number()
        .min(1)
        .max(50)
        .optional()
        .default(5)
        .describe("Max results to return"),
    },
  },
  async ({ user_id, q, limit }) => {
    const params = new URLSearchParams({ user_id, q, limit: String(limit) });
    const data = await smaraFetch(`/v1/memories/search?${params}`);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Get user context ────────────────────────────────
server.registerTool(
  "get_user_context",
  {
    title: "Get User Context",
    description:
      "Retrieve a pre-formatted context string for a user, ready to inject into an LLM system prompt. Returns the most relevant memories ranked by decay-aware scoring.",
    inputSchema: {
      user_id: z.string().describe("User to get context for"),
      q: z
        .string()
        .optional()
        .describe("Optional query to focus the context on a topic"),
      top_n: z
        .number()
        .min(1)
        .max(20)
        .optional()
        .default(5)
        .describe("Number of top memories to include"),
    },
  },
  async ({ user_id, q, top_n }) => {
    const params = new URLSearchParams({ top_n: String(top_n) });
    if (q) params.set("q", q);
    const data = await smaraFetch(`/v1/users/${encodeURIComponent(user_id)}/context?${params}`);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Delete a memory ─────────────────────────────────
server.registerTool(
  "delete_memory",
  {
    title: "Delete Memory",
    description: "Delete a specific memory by ID. Use when a user asks to forget something.",
    inputSchema: {
      id: z.string().describe("The memory ID to delete"),
    },
  },
  async ({ id }) => {
    await smaraFetch(`/v1/memories/${encodeURIComponent(id)}`, { method: "DELETE" });
    return { content: [{ type: "text" as const, text: JSON.stringify({ deleted: id }) }] };
  },
);

// ── Get usage stats ─────────────────────────────────
server.registerTool(
  "get_usage",
  {
    title: "Get Usage",
    description:
      "Check current memory usage — plan, limits, and how many memories are stored. Useful for monitoring quota.",
    inputSchema: {},
  },
  async () => {
    const data = await smaraFetch("/v1/usage");
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Start ────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Smara MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
