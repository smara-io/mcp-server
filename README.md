# @smara/mcp-server

MCP server for the [Smara Memory API](https://smara.io) — give any AI app persistent memory with Temporal Memory Scoring™.

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
| `search_memories` | Semantic search with Temporal Memory Scoring™ |
| `get_user_context` | Pre-formatted context string for LLM system prompts |
| `delete_memory` | Delete a specific memory |
| `get_usage` | Check plan limits and memory count |

## How It Works

Smara uses **Temporal Memory Scoring™** — a proprietary ranking system that makes AI memory work like human recall. Memories naturally fade over time, modulated by importance and access patterns. Recent, critical memories surface first. Stale, trivial ones fade. Contradictions are auto-detected and resolved.

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
