<!-- Source of the README in the exported plugin (apps/wallet-cli/scripts/export-agent-plugin.mjs): its links resolve in the export. -->

# Ledger Agent Skills

A plugin that gives AI agents one skill, `wallet-cli-usage`, for driving the Ledger wallet-cli from a terminal. With it an agent can discover accounts, check balances and history, send, swap and stake from a Ledger connected over USB, and encrypt files with the Ledger Key Ring. It can also enroll itself for Agent Intents, import your Ledger Sync accounts, propose Ethereum and Solana payments and Ethereum swaps that you approve or reject on your Ledger, check their status and cancel a proposal, from a machine that has no Ledger attached. The skill lives in [`skills/wallet-cli-usage/SKILL.md`](skills/wallet-cli-usage/SKILL.md).

## Install

Every platform installs from this git repository. The plugin is called `agent-skills` and its skill `wallet-cli-usage`.

### OpenClaw

```bash
openclaw plugins install git:github.com/LedgerHQ/agent-skills
openclaw skills list
```

`wallet-cli-usage` should appear in the skill list.

### Hermes

```bash
hermes plugins install LedgerHQ/agent-skills --enable
hermes plugins list
```

Hermes exposes the skill as `agent-skills:wallet-cli-usage`.

### Cursor

```bash
git clone https://github.com/LedgerHQ/agent-skills ~/.cursor/plugins/local/agent-skills
```

Cursor needs a real directory at that path, so clone into it rather than symlinking a checkout. Then run Developer: Reload Window from the command palette and look for the plugin under Customize.

### Grok Bot

Grok Bot reads the same files as Cursor. How to load them into Grok Bot is not documented here yet.

### Claude Code

```bash
claude plugin marketplace add LedgerHQ/agent-skills
claude plugin install agent-skills@agent-skills
```

### Codex

```bash
codex plugin marketplace add LedgerHQ/agent-skills
```

Then install the `agent-skills` plugin from the `agent-skills` marketplace. The install command has not been checked against a Codex CLI, so look it up with `codex plugin --help`.

### Other agents

```bash
npx skills add LedgerHQ/agent-skills -s wallet-cli-usage
```

You can also copy the [`skills/wallet-cli-usage`](skills/wallet-cli-usage) directory into your agent's skills directory by hand.

## Requirements

You need the Ledger wallet-cli at the version of this plugin or later (`version` in `plugin.json`), since the plugin is exported from wallet-cli with its version:

```bash
npm i -g @ledgerhq/wallet-cli
wallet-cli --version
```

Device commands (`account discover`, `receive`, `send`, `swap execute`, `genuine-check`, `earn deposit` and `earn withdraw`, `ring init`) need an unlocked Ledger connected over USB to the machine that runs them. The Ledger Key Ring and Agent Intents also store keys in the OS keychain: macOS Keychain, Windows Credential Manager, or a Secret Service provider such as gnome-keyring on Linux. Agent Intents can use an unencrypted key file instead, only when you agree (see below). Swap quotes (`swap quote`, `swap execute`, `agent-intent swap`) use a Ledger API auth key that wallet-cli creates on first use and keeps in the same keychain; without a usable keychain they run unauthenticated, and on macOS the keychain may ask for access.

An agent on a remote box or in a container (Grok Bot, a VPS, CI) has no USB access. It can still use Agent Intents, including importing your Ledger Sync accounts with `agent-intent sync`, which needs no device. It cannot set up the Ledger Key Ring: `ring init` stores a credential in the keychain of the machine that runs it, so handing it to you would set up your computer instead. For the same reason it asks for addresses or syncs your accounts instead of running `account discover`. For any other device command, the agent gives you the exact `wallet-cli` command to run on your own computer with the Ledger plugged in and asks you to report the result.

## Agent Intent setup

The skill treats the agent as a remote agent: it runs on a machine without a Ledger, holds its own software key, and proposes payments and swaps that only you can approve. It enrolls against the production Agent Intent service and declares the runtime it runs in with `--source` (`openclaw`, `hermes`, `claude-code`, `codex`, `cursor`, `muse`, `grok-bot` or `other`).

Your part takes two steps:

1. When the agent enrolls, it sends you a link and a fingerprint. Before you open it, update your Ledger's firmware if Ledger Wallet offers it, make sure Ledger Sync is on, and quit the Ledger Wallet desktop app so the browser can reach the device. Open the link once, check that the page shows the same fingerprint, and approve on your Ledger twice: the agent identity, then sharing your Ledger Sync accounts with it. Keep the page open from clicking Review until both approvals finish; leaving it closes the relay and the agent has to start over. You send nothing back: the approval reaches the agent's waiting enrollment over an encrypted relay. The link expires after 30 minutes by default. If the page reports that Ledger Sync account access was not shared, fix the cause (outdated firmware is a known one) and press "Try again" before the link expires.
2. For each payment or swap the agent proposes, open the review link it gives you and approve or reject the intent on your Ledger. Ask the agent at any time for an intent's status, for the list of what it proposed, or to cancel a proposal you have not signed yet.

Once enrolled, the agent can also import the accounts you sync through Ledger Sync (`agent-intent sync`), so it can refer to them by label. It reads public account data only and never uploads anything. When you ask for a payment or swap without saying where from, the agent lists your accounts on the matching network (Ethereum or Solana) and lets you pick one.

Every intent an agent creates is real. Reject the ones you do not want; the agent gives you the intent ID with each review link.

The enroll command prints the link at once but waits until you approve. On Linux and macOS the agent runs `enroll --detach`, which hands that wait to a background listener; on Windows it runs `enroll` as a background job of its terminal tool. Either way it checks on the enrollment with `agent-intent wait`. `recover` runs as a background job too, whose output the agent reads. On a host that kills background processes when a command returns, or whose terminal tool has no background jobs when one is needed, the agent cannot complete that enrollment or recovery, though it can still run every other Agent Intent command. If the listener or command stops before you approve, that enrollment is lost and the agent starts a new one under a new profile ID.

On Linux without a Secret Service provider (common on headless boxes and in containers), enrollment fails with `keychain_unavailable` and saves nothing. The agent then asks whether it may store its key in plaintext; only if you say yes in that conversation does it re-run enrollment with `--allow-plaintext-key`. The key then goes unencrypted to `~/.local/state/ledger-wallet-cli/agent-intent-keys/<profile>.key` (mode 0600), where any process running as the same user can read it. The keychain entry and the key file are tied to the wallet-cli state directory (by default `~/.local/state/ledger-wallet-cli`, on Windows `%LOCALAPPDATA%\ledger-wallet-cli\State`) and the OS user, so keep both the same between runs or the agent loses its key.

On Grok Bot, run a real `agent-intent send` in a 1:1 DM with the bot. Its auto-review blocks the command in shared rooms.

## Disclosure

The plugin is Markdown instructions and JSON manifests only, with no hooks, MCP servers, telemetry or code. The skill has the agent:

- run `wallet-cli` shell commands, and install `@ledgerhq/wallet-cli` globally with a package manager when it is missing;
- reach Ledger services through wallet-cli: blockchain data, swap and staking providers, Ledger Sync, and the Agent Intent service with its encrypted enrollment relay;
- leave a background listener (`wallet-cli agent-intent enroll --detach`) or a background job (`recover`, and `enroll` on Windows) waiting until you approve on your Ledger;
- store credentials through wallet-cli: the Agent Intent agent key, the Ledger Key Ring credential and the Ledger API auth key for swap quotes go to the OS keychain (the agent key goes to an unencrypted 0600 file instead only when you agree), and wallet-cli keeps its state in `~/.local/state/ledger-wallet-cli` (Windows: `%LOCALAPPDATA%\ledger-wallet-cli\State`).

## Hermes catalog

Hermes loads the plugin from the root `plugin.json` (Agent Plugins v1). Do not add a `plugin.yaml`: Hermes would treat the plugin as a native one, which takes precedence, and the skill would no longer load.

To list a release, open a PR to [`NousResearch/hermes-agent`](https://github.com/NousResearch/hermes-agent) that adds `plugin-catalog/agent-skills.yaml` with the content below, following the [catalog submission guide](https://hermes-agent.nousresearch.com/docs/developer-guide/plugins/catalog-submission). Set `sha` to the full SHA of the release commit on `main` and `version` to the version in `plugin.json`, then check that commit with `hermes plugins validate <checkout> --install-deps`. Copy the [Disclosure](#disclosure) list into the PR description.

```yaml
name: agent-skills
title: Ledger Agent Skills
repo: https://github.com/LedgerHQ/agent-skills
sha: <full SHA of the release commit>
description: "Ledger wallet-cli skill: send, swap and stake from a Ledger hardware wallet, and propose Ethereum and Solana payments and Ethereum swaps through Agent Intents that a human approves on their Ledger. Disclosure — Markdown skill and JSON manifests only (no hooks, MCP servers or code); it has the agent run wallet-cli shell commands (and install @ledgerhq/wallet-cli when missing), which call Ledger services; enroll/recover wait in the background until the human approves; wallet-cli stores the agent key in the OS keychain (or, only with the human's consent, an unencrypted 0600 file), a Ledger API auth key for swap quotes in the OS keychain, and state in ~/.local/state/ledger-wallet-cli (Windows: %LOCALAPPDATA%\\ledger-wallet-cli\\State)."
maintainer: LedgerHQ
tier: community
category: tools
docs_url: https://github.com/LedgerHQ/agent-skills#readme
requires_hermes: ">=0.21.5"
version: "<version from plugin.json>"
capabilities:
  provides_tools: []
  provides_hooks: []
  provides_middleware: []
  requires_env: []
```

## Legal Notice

These AI skills are provided by Ledger SAS as a developer resource to accelerate integration with Ledger products. They are provided "as is," without warranty of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.

Skills encode patterns derived from official Ledger documentation and publicly available source code. They do not constitute a security audit, certification, or endorsement of any code, smart contract, or application built using them.

Ledger SAS does not guarantee that outputs from these skills are secure, correct or free from vulnerabilities. Due to the non-deterministic nature of artificial intelligence models, you acknowledge that outputs generated by these skills may contain errors, inaccuracies, or outdated information. The developer is solely responsible for the security, correctness, and compliance of their code, smart contracts and applications.

Use of these skills does not establish any contractual, advisory, partnership, or fiduciary relationship between the developer and Ledger SAS or its affiliates.
To the maximum extent permitted by law, Ledger SAS and its affiliates shall not be liable for any direct, indirect, incidental, special, punitive, or consequential damages arising from the use of, or reliance on, these skills. This includes, but is not limited to, the loss of digital assets, unauthorized access, smart contract exploits, or application malfunction.
