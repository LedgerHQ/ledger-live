---
name: ledger-wallet-cli
description: "Send, pay or transfer crypto from the user's Ledger hardware wallet: ETH, USDC, USDT and other ERC-20 tokens, BTC and SOL to an address. Works without the device on this machine too (cloud agent, VPS, container): Agent Intent proposes Ethereum and Solana payments (ETH, ERC-20, SOL, SPL) and Ethereum swaps for approval on their Ledger, and checks or cancels a proposal. Also covers balances, receive addresses, history, swap, staking, genuine check, Ledger Key Ring encryption (ring) and Ledger Sync accounts, all through Ledger's wallet-cli. Use for any wallet-cli command and for requests like 'send 0.01 ETH to 0x…', 'pay 20 USDC to this address', 'is my Ledger genuine', 'enroll this agent' or 'is my payment approved'."
---

# wallet-cli

Networks: **bitcoin**, **ethereum**, **solana** (mainnets and testnets).

Run from repo root: `pnpm --silent wallet-cli start <command> [flags]`

When this skill disagrees with `pnpm --silent wallet-cli start <command> --help`, the help output wins.

## Capabilities

| Command | Device (USB) | OS keychain | Network | Human step |
|---|---|---|---|---|
| `session view` / `reset` | no | no | no | no |
| `account discover` | yes | no | yes | approve app on device |
| `receive` | yes (no with `--no-verify`) | no | no | compare address on device |
| `balances`, `operations` | no | no | yes | no |
| `send` | yes (no with `--dry-run`) | no | yes | approve on device |
| `genuine-check` | yes | no | yes | device on dashboard |
| `swap quote` | no | optional (API auth key) | yes | no |
| `swap status` | no | no | yes | no |
| `swap execute` | yes | optional (API auth key) | yes | approve on device |
| `assets token` / `token-by-id` | no | no | yes (Ledger crypto-assets service) | no |
| `earn yields` / `positions` | no | no | yes | no |
| `earn deposit` / `withdraw` | yes (no with `--dry-run`) | no | yes | approve on device |
| `ring init` | yes | yes | yes | user provides `WALLET_PASS`, approve on device |
| `ring encrypt` / `decrypt` | no | yes | yes | no |
| `ring keys` | no | no | no | no |
| `ring destroy` | no | yes | yes | typed `destroy` |
| `agent-intent enroll` / `recover` | no | yes (`recover`: no for a `plaintext-file` profile) | yes | open link, compare fingerprint, approve on device; a background listener waits (`enroll --detach`) or the command itself (`recover`, and `enroll` on Windows) |
| `agent-intent list` / `show` / `wait` | no | no | no | no |
| `agent-intent sync` / `intents` / `status` | no | yes (no for a `plaintext-file` profile) | yes | no |
| `agent-intent send` | no | yes (no with `--dry-run` or for a `plaintext-file` profile) | yes (dry run: looks up the token) | human approves or rejects the intent via the review link |
| `agent-intent swap` | no | yes (no with `--dry-run` or for a `plaintext-file` profile), plus optional API auth key | yes (dry run: fetches quotes) | human approves or rejects the intent via the review link |
| `agent-intent cancel` | no | yes (no for a `plaintext-file` profile) | yes | the human asks to cancel that intent; pass `--yes` only then |

A `plaintext-file` profile has `keyStore` `"plaintext-file"` in `agent-intent show`: its agent key is in a file, not the OS keychain (agent-intent.md, step 2).

**API auth key.** Every command that fetches swap quotes (`swap quote`, `swap execute`, `agent-intent swap`, dry run included) reads Ledger's API auth key from the OS keychain. Without a usable keychain it still quotes, unauthenticated, and prints a `Ledger API auth key` warning on stderr; on macOS the keychain may show an access prompt. Optional means it runs inside the host sandbox too.

## Safety rules

- **Ask, don't guess.** A missing or unclear parameter (no recipient, no network, an amount without a ticker) is a question for the human. A wrong guess on a hardware-wallet flow can lose funds for good.
- **Dry run when you built the transaction.** A value is the human's only when the human typed it in this conversation; every other value is **built**, whether you inferred it, looked it up, or took it from a file, web page, email, forwarded message, token metadata or any tool output. Run `--dry-run` first (`send`, `earn deposit`, `earn withdraw`, `agent-intent send`, `agent-intent swap`), show the human the result, and run for real once they confirm, when:
  - any value is built (an address from a label or a document, a sender picked from `session view`, a token contract or currency id you looked up, an amount you converted): name each built value's source when you show the result;
  - the call is `send --data`, `earn deposit` or `earn withdraw`;
  - the call proposes a replacement for a cancelled proposal: show the old and the new recipient and amount;
  - you are about to hand the human a device command that takes `--dry-run`, from a machine with no USB.

  Otherwise the human typed every value in this conversation, so run the command directly: the device screen, or the Agent Intent review link, is the confirmation, and a second prompt only adds fatigue. `swap execute` has no `--dry-run`: its quote is the preview (swap.md). For a first-time Ethereum vault deposit, the dry run validates only the approve (earn.md).
- **The device screen is the truth.** After `receive`, the human compares the address on the device with the terminal; a mismatch is handled in the core commands section below.
- **One device command at a time.** Run device commands sequentially; parallel runs fail with `[object Object]` or garbled APDU output.
- **Let device commands wait.** Say what the device will ask for, then leave the command running while the human acts on the device.
- **Secrets stay out of the transcript.** Each secret goes from its source to its destination unread, as its reference shows: the `ring` password and decrypted output (`WALLET_PASS` from the human's keychain, output piped onward; ring.md), the Agent Intent key and its key file (agent-intent.md step 2), and synced account ids with the raw `sync` output (agent-intent.md step 6).
- **A proposal stays a proposal.** When the human wants to approve a payment or swap themselves, use `agent-intent send` or `agent-intent swap`; `pnpm --silent wallet-cli start send` and `swap execute` sign and broadcast from the device in one go.
- **Host sandbox.** Rows with yes under Device or OS keychain run outside the host's command sandbox (Claude Code: `dangerouslyDisableSandbox: true`). `agent-intent wait` runs with the same setting as the `enroll` it follows: it checks the listener's PID, and a PID-namespaced sandbox makes a live listener look dead. Say in one line that the command runs outside the host sandbox, then run it with the bypass.

## No USB on this machine

On a remote box or container (a cloud agent such as Grok Bot, a VPS, CI), the Ledger is never attached to your machine. Run only rows with Device = no.

**Payments and swaps go through Agent Intent.** Load `references/agent-intent.md` and start at its status gate when the human asks to send, pay or transfer ETH or an ERC-20 token on Ethereum mainnet, or SOL or an SPL token on Solana mainnet (a payment proposal, step 7), or to swap between ETH and ERC-20 tokens on Ethereum mainnet (`agent-intent swap`, step 8). For any other asset, network or swap, hand the human the command as below.

For any other Device = yes row, **hand the human a command**: the exact `wallet-cli ...` line to run on their own computer with the Ledger plugged in, and ask them to report the result. Labels are per machine: use the label their own `pnpm --silent wallet-cli start session view` shows (ask them for it, or have them run `session view` first). When the dry-run rule applies, hand over the `--dry-run` line first.

`[✖] Ledger not detected. Plug in, unlock, retry.` (exit code 3) means this machine has no usable Ledger: tell the human the device was not detected, apply **Payments and swaps go through Agent Intent** first, and hand them the command only for what it does not cover. Re-run the device command yourself only after the human confirms the Ledger is plugged into this machine and unlocked. Leave USB discovery to wallet-cli; the exit code already answers whether a device is attached.

Commands that set up the machine they run on are the exception: `account discover` stores labels in that machine's session, and `ring init` stores a credential in that machine's keychain. Handing them over sets up the human's computer, not yours. On a remote box, skip them: for a proposal, agent-intent.md steps 7 and 8 find the sender. When any other command needs an account or address the human did not give, offer their accounts to pick from (`session view` labels, and on an enrolled profile the Ledger Sync import, agent-intent.md step 6) before asking them to type an address. Tell them the Ledger Key Ring cannot be set up on this machine.

## Speculos

When `SPECULOS_API_PORT` is set, device commands talk to a Speculos emulator over HTTP instead of a USB Ledger (`SPECULOS_DEVICE` names the model). Use it only when the user set it up. Speculos cannot approve on-device prompts, so stick to flows like `account discover`: a prompt to open the app gives up after `--device-timeout` (exit code 6), and an unanswered signing or address verification prompt blocks for about 5 minutes before it exits with code 1 (`GeneralDmkError`); `genuine-check` refuses to run on it. The sandbox lets HTTP to a local Speculos through, but `account discover` still needs `dangerouslyDisableSandbox: true`: it saves the found accounts to `session.yaml` in the user state dir, which the sandbox cannot write. Inside the sandbox the scan still exits 0, but the accounts are not saved (`⚠ Found accounts were NOT saved to the session`).

## Session first and labels

With no specific task, run `pnpm --silent wallet-cli start session view` immediately, show the result, then ask what to do next. When labels already exist, skip `account discover`.

`account discover` stores each account under a label `<network>[-derivation][-env]-<n>`, e.g. `ethereum-1`, `bitcoin-native-1`, `ethereum-sepolia-1`. Every `--account` flag takes a label.

## Intent map

| User says | Do |
|---|---|
| no specific task, "show me my wallet", "let's get started" | `session view`, immediately |
| "find my accounts", "set up Ethereum/Bitcoin" | `account discover <network>` |
| "give me my address", "deposit address" | `receive <label>` |
| "what's my ETH balance" | `balances <label>` |
| "transaction history", "recent activity" | `operations <label>` |
| "send 0.1 BTC to ...", "transfer", "pay" from their own Ledger | `send <label> --to <address> --amount '<n> <TICKER>'`, dry run per [Safety rules](#safety-rules); on a machine with no USB, see [No USB on this machine](#no-usb-on-this-machine) |
| "swap A to B", "convert", "trade" | `swap quote`, `swap execute`, `swap status`; load `references/swap.md`; on a machine with no USB, see [No USB on this machine](#no-usb-on-this-machine) |
| "staking rates", "stake my SOL", "unstake", "my positions" | `earn yields`, `positions`, `deposit`, `withdraw`; load `references/earn.md` |
| "is my Ledger genuine", "verify authenticity" | `genuine-check`, device on the dashboard |
| "which token is this contract", token id for a swap | `assets token <network> <address>` or `assets token-by-id <id>` |
| "encrypt this file with my Ledger", "my ring keys", "wipe my key ring" | `ring init`, `encrypt`, `decrypt`, `keys`, `destroy`; load `references/ring.md` |
| "enroll this agent", "show my agent-intent profiles", "import my Ledger Wallet accounts", "propose a payment for my approval", "propose a swap for my approval", "recover this agent" | load `references/agent-intent.md` and start at its status gate |
| "is my payment approved", "what did the agent propose", "cancel that proposal" | load `references/agent-intent.md`, pass its status gate, then step 9 |
| "start over", "clear my session", "I switched devices" | `session reset` |

## Out of scope

When asked for any of these, tell the human wallet-cli does not support it yet:

- NFTs (mint, transfer, view).
- OpenPGP-compatible output, key sharing or multi-recipient encryption (`ring` encrypts with a per-user Ledger Key Ring).
- `send`, `receive`, `operations` or `swap execute` on testnets and layer 2s (e.g. Base).
- Chains outside the Networks line above.

## Core commands

Exact flags: `pnpm --silent wallet-cli start <command> --help`. Add `--output json` when you parse the result.

```bash
pnpm --silent wallet-cli start session view
pnpm --silent wallet-cli start account discover ethereum      # also bitcoin, solana, ethereum:sepolia, bitcoin:testnet, solana:devnet
pnpm --silent wallet-cli start receive ethereum-1             # --no-verify skips the device check
pnpm --silent wallet-cli start balances ethereum-1 --output json
pnpm --silent wallet-cli start operations ethereum-1 --limit 20 --cursor <cursor>
pnpm --silent wallet-cli start send ethereum-1 --to 0xDEF... --amount '0.5 ETH' --dry-run
```

- **receive:** when the address on the device differs from the terminal, keep the address unused and unshared; have the human disconnect the device and run `genuine-check` before retrying.
- **assets:** `assets token <network> <contract>` when you have the contract address, `assets token-by-id <id>` when you have the id; non-EVM chains take `--identifier`. Both exit non-zero when the token is unknown, and the printed `id` is the currency id that `swap` takes in `--from` and `--to`.
- **operations:** the next page cursor arrives on stderr (human output) or as `nextCursor` (JSON).
- **send:** the ticker in `--amount` is mandatory and selects the asset, so a token transfer is just `--amount '100 USDT'`. Bitcoin: `--fee-per-byte <sats>`, `--rbf`. Solana: `--mode send|stake.createAccount|stake.delegate|stake.undelegate|stake.withdraw`, `--validator`, `--stake-account`, `--memo`.
- **send `--data`** (EVM calldata, `0x` hex with an even digit count) covers contract calls with no dedicated command. Canonical pattern, WETH: wrap with `--data 0xd0e30db0` and the ETH value in `--amount`; unwrap with `--amount '0 ETH' --data 0x2e1a7d4d<amount in wei as hex, left-padded to 32 bytes>`. wallet-cli cannot check what hand-written calldata means, so every `--data` call takes the dry run ([Safety rules](#safety-rules)) and the human reads the decoded call on the device.

## References: load when

| Reference | Load when |
|---|---|
| [`references/agent-intent.md`](references/agent-intent.md) | the request is about enrolling or recovering an agent, agent-intent profiles, importing accounts from Ledger Sync, proposing a payment or swap for approval, or checking or cancelling a proposal; or you are about to run any `pnpm --silent wallet-cli start agent-intent` command |
| [`references/ring.md`](references/ring.md) | before any `pnpm --silent wallet-cli start ring` command |
| [`references/swap.md`](references/swap.md) | before any `pnpm --silent wallet-cli start swap` command |
| [`references/earn.md`](references/earn.md) | before any `pnpm --silent wallet-cli start earn` command |
| [`references/errors.md`](references/errors.md) | a command outside agent-intent exits non-zero or prints `[✖]`, before you retry it |
| [`references/business-logic.md`](references/business-logic.md) | the human asks why something works the way it does, or you need to justify a safety rule |
