# @smara/mcp-server

MCP server for the [Smara Memory API](https://smara.io) — give any AI app persistent, decay-aware memory.

## Quick Start

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "smara": {
      "command": "npx",
      "args": ["-y", "@smara/mcp-server"],
      "env": {
        "SMARA_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Get a free API key at [smara.io](https://smara.io) (10,000 memories, no credit card).

## Tools

| Tool | Description |
|------|-------------|
| `store_memory` | Store a fact about a user with importance scoring |
| `search_memories` | Semantic search with Ebbinghaus decay-aware ranking |
| `get_user_context` | Pre-formatted context string for LLM system prompts |
| `delete_memory` | Delete a specific memory |
| `get_usage` | Check plan limits and memory count |

## How It Works

Smara combines vector similarity search (Voyage AI embeddings) with Ebbinghaus forgetting curves. Memories decay over time — recent, frequently-accessed memories rank higher, just like human recall.

```
score = similarity × 0.7 + decay_score × 0.3
```

## Works With

- Claude Desktop
- Claude Code
- Cursor
- Windsurf
- VS Code (GitHub Copilot)
- Any MCP-compatible client

## Environment Variables

| Variable | Required | Default |
|----------|----------|---------|
| `SMARA_API_KEY` | Yes | — |
| `SMARA_API_URL` | No | `https://api.smara.io` |

## License

MIT
