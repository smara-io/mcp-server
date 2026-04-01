#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { smaraFetch, DEFAULT_SOURCE, DEFAULT_USER_ID, DEFAULT_NAMESPACE } from "./api-client.js";

const userIdHint = DEFAULT_USER_ID
  ? `The user_id for this session is "${DEFAULT_USER_ID}". Always use this value.`
  : `Use a stable identifier for user_id — the project name, directory name, or username. Be consistent across sessions.`;

const server = new McpServer(
  { name: "smara", version: "2.0.0" },
  {
    instructions: `You have access to Smara, a persistent cross-platform memory system. Memories stored here persist across conversations and are shared across all AI tools the user has connected.

AUTOMATIC BEHAVIOR (do this without being asked):
1. AT CONVERSATION START: Call get_user_context with the user's ID to load relevant memories. If the conversation has a clear topic, pass it as the query parameter to focus results.
2. WHEN YOU LEARN NEW FACTS: If the user shares a preference, correction, important decision, project detail, or personal fact, call store_memory to save it. Use importance 0.7-1.0 for preferences and corrections, 0.5 for general facts, 0.1-0.3 for trivia.
3. WHEN THE USER SAYS "remember this" or "don't forget": Always call store_memory with importance 0.9.
4. WHEN THE USER SAYS "forget this" or "delete that memory": Call search_memories to find the relevant memory, then call delete_memory with its ID.

${userIdHint}

RULES:
- Do not store transient conversational filler. Only store facts useful in a future conversation.
- Do not announce memory operations unless the user asks. Load and store silently.
- If get_user_context returns memories, incorporate them naturally into your understanding.
- Smara handles deduplication automatically — don't worry about storing something twice.`,
  }
);

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
      namespace: z
        .string()
        .optional()
        .describe("Memory namespace for isolation (default: from env or 'default')"),
    },
  },
  async ({ user_id, fact, importance, namespace }) => {
    const data = await smaraFetch("/v1/memories", {
      method: "POST",
      body: JSON.stringify({
        user_id,
        fact,
        importance,
        source: DEFAULT_SOURCE,
        namespace: namespace || DEFAULT_NAMESPACE,
      }),
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
      "Semantic search across stored memories for a user. Ranked by Temporal Memory Scoring — balances semantic relevance with memory freshness and importance.",
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
      namespace: z
        .string()
        .optional()
        .describe("Memory namespace (default: from env or 'default')"),
    },
  },
  async ({ user_id, q, limit, namespace }) => {
    const params = new URLSearchParams({
      user_id,
      q,
      limit: String(limit),
      namespace: namespace || DEFAULT_NAMESPACE,
    });
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
      "Retrieve a pre-formatted context string for a user, ready to inject into an LLM system prompt. Ranked by Temporal Memory Scoring. Can be called without a query to get the most important recent memories.",
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
      namespace: z
        .string()
        .optional()
        .describe("Memory namespace (default: from env or 'default')"),
    },
  },
  async ({ user_id, q, top_n, namespace }) => {
    const params = new URLSearchParams({
      top_n: String(top_n),
      namespace: namespace || DEFAULT_NAMESPACE,
    });
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
  console.error("Smara MCP Server v2.0.0 running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
