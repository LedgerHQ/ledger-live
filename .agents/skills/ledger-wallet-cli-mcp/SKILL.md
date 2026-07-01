---
name: ledger-wallet-cli-mcp
description: Run wallet-cli as an MCP server so agents call Ledger USB flows as typed MCP tools. Use for "add wallet-cli to Claude/Cursor/Codex", "MCP setup", "expose wallet-cli as tools".
---

# wallet-cli — MCP server

`wallet-cli mcp` starts a **stdio Model Context Protocol (MCP) server** that exposes every wallet-cli operation as a typed MCP tool. Instead of shelling out to the CLI, an MCP-capable agent (Claude Code, Claude Desktop, Cursor, Codex, …) calls the tools directly and gets back the same structured envelopes as `--output json`. Networks: **bitcoin**, **ethereum**, **solana** (mainnet only for device flows).

Run from repo root: `pnpm --silent wallet-cli start <command> [flags]`

> **Skills = methodology, MCP = tools.** This skill (and the sibling `ledger-wallet-cli-*` skills) is the _methodology_: when to run a flow, how to map an informal request, and the hardware-wallet safety rails. The MCP server is the _transport_: it hands the agent the tools. Read the skills first, then call the MCP tools — the safety rails in [`references/safety.md`](references/safety.md) apply identically whether you use the CLI or the MCP tools.

> **Read first:** shared hardware-wallet safety rails in [`references/safety.md`](references/safety.md) (USB requirement, device contention/serialization, on-device confirmation, ambiguous→ask, out-of-scope, shared error table). For _why_ device flows behave this way, see the umbrella skill's `references/business-logic.md` (retrieve with `wallet-cli skill retrieve ledger-wallet-cli --file references/business-logic.md`).

---

## Start the server

The server speaks JSON-RPC over stdio — stdout is reserved for the protocol, logs go to stderr. It is normally launched by the MCP client, not by hand:

```bash
pnpm --silent wallet-cli start mcp
```

---

## Setup per agent

The MCP client launches the installed `wallet-cli` binary with the `mcp` subcommand. `wallet-cli mcp --install --agent <claude|cursor|codex>` writes the matching config for you (`--print-config` prints it instead); the equivalent snippets are below.

### Claude Code

```bash
claude mcp add ledger -- wallet-cli mcp
```

### Claude Desktop / Cursor (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "ledger": {
      "command": "wallet-cli",
      "args": ["mcp"]
    }
  }
}
```

Claude Desktop uses the same shape in its `claude_desktop_config.json`.

### Codex (`~/.codex/config.toml`)

```toml
[mcp_servers.ledger]
command = "wallet-cli"
args = ["mcp"]
```

---

## Tools

Each tool mirrors the CLI command of the same name and returns the identical envelope as `--output json`. `<account>` arguments are session labels (e.g. `ethereum-1`); if the session is empty, run `account_discover` first.

| Tool                 | CLI equivalent       | Device | Notes                                                     |
| -------------------- | -------------------- | ------ | -------------------------------------------------------- |
| `account_discover`   | `account discover`   | Yes    | Discover/import accounts for a network onto the session. |
| `session_view`       | `session view`       | No     | List saved session accounts.                            |
| `session_reset`      | `session reset`      | No     | Wipe the session.                                       |
| `balances`           | `balances`           | No     | Native + token balances.                                |
| `operations`         | `operations`         | No     | Operation history (paginate with limit/cursor).         |
| `receive`            | `receive`            | Yes\*  | \*Device only when verifying the address on screen.     |
| `send`               | `send`               | Yes\*\* | \*\*Device only for a real send; dry-run needs no device. |
| `swap_quote`         | `swap quote`         | No     | Quotes from the built-in provider list.                 |
| `swap_execute`       | `swap execute`       | Yes    | Full swap flow, then sign + broadcast.                  |
| `swap_status`        | `swap status`        | No     | Read swap status from the partner API.                  |
| `genuine_check`      | `genuine-check`      | Yes    | Verify the connected device is genuine.                 |
| `assets_token`       | `assets token`       | No     | Resolve token metadata by contract address.             |
| `assets_token_by_id` | `assets token-by-id` | No     | Resolve token metadata by token id.                     |

Device-touching tools (`account_discover`, `receive` with verify, `send` non-dry-run, `swap_execute`, `genuine_check`) emit MCP **progress notifications** mapped from the device state (e.g. awaiting unlock, awaiting on-device approval), so keep the call running rather than timing it out.

---

## Safety notes (device tools)

- **USB required.** Device tools drive a physical Ledger over USB — the device must be connected and unlocked. There is no remote/network signing.
- **Serialized, never parallel.** The server holds a single device lock: only one device-touching tool runs at a time. The USB HID channel does not multiplex, so concurrent device calls corrupt each other's APDU exchange. Never fan out device tools in parallel.
- **On-device confirmation is the source of truth.** The host cannot be trusted; the user must verify address/amount/recipient/fees on the Ledger screen. Treat any mismatch as a possible compromise, not a glitch.
- **Ambiguous → ask.** Never guess a recipient, amount, ticker, or network for a device tool — a wrong guess is irreversible fund loss.

---

## Errors

See [`references/safety.md`](references/safety.md) for the shared device/USB error table (USB timeout, device not detected, contention, rejected-on-device, locked device). A failing device tool returns a structured MCP error carrying the same `code` and `exitCode` as the equivalent CLI command.
