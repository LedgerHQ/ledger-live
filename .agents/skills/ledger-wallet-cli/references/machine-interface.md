# wallet-cli - machine interface

Field-by-field reference for parsing wallet-cli output: envelope schemas, the error-code table, exit codes, intermediate events, per-command JSON data keys, and environment variables. Load when writing or debugging a parser, or when dispatching on an exit code / `error.code`.

For the command surface, safety rails, and informal-request mapping, see the main `SKILL.md` in this skill folder. Commands are referred to by name here (e.g. `send`, `swap execute`); invoke them however the main skill prescribes.

---

## Streams and modes

- `--output json` is per command (default is `human`); there is no global JSON switch.
- In JSON mode, **stdout is NDJSON**: one JSON object per line — zero or more intermediate events, then exactly **one** final envelope. No ANSI escapes reach either stream.
- In human mode, data goes to stdout and progress/errors to stderr.
- Agent environments are auto-detected (`CLAUDECODE`, `CLAUDE_CODE`, `CURSOR_AGENT`, `CODEX_ENABLED`, `GEMINI_CLI`, `OPENCODE`, `AMP_CURRENT_THREAD_ID`, or non-TTY stderr): spinners are disabled and help/version/framework errors render as JSON even without `--output json`.

---

## Final envelopes

### Success (stdout, JSON mode)

```json
{ "status": "success", "command": "<command>", "network": "<network>", "account": "<label>", "...": "per-command data keys", "timestamp": "<ISO-8601>" }
```

- Keys on `status` — there is no `ok` field on success.
- `account` is present only for account-scoped commands.
- Per-command data keys are listed below.

### Error (stdout, JSON mode)

```json
{
  "ok": false,
  "error": {
    "command": "<command>",
    "code": "<WalletCliErrorCode>",
    "message": "<human-readable message>",
    "retryable": false,
    "hint": "<optional next step>",
    "details": { "...": "optional structured fields, per code" },
    "provider_errors": ["only for swap_quotes_unavailable"]
  }
}
```

- `code` is **always** present; `unknown` is the fallback for unclassified errors.
- `retryable` is **always** present (see the code table for semantics).
- `hint` and `details` are optional; `details` fields are guaranteed for `wrong_app`, `app_not_installed`, and `device_ambiguous` (see table).

### Framework (bunli) shapes

Emitted by the CLI framework layer, before the command handler runs — these bypass the `--output json` contract:

| Shape                                                                                                              | Stream | Exit | When                                              |
| ------------------------------------------------------------------------------------------------------------------ | ------ | ---- | -------------------------------------------------- |
| `{"ok":false,"error":{"kind":"validation","name","tag","message","command","option","expectedType"}}`             | stderr | 1    | a flag declared `required` by the framework is missing or a value fails schema validation |
| `{"ok":false,"error":{"kind":"command-not-found","message","available":[...]}}`                                   | stderr | 1    | unknown command (`available` lists valid commands) |
| `{"ok":false,"error":{"kind":"command-execution","name","tag","message","command"}}`                              | stderr | varies | a handler error rendered in human/agent mode      |
| `{"ok":true,"data":{"type":"help"\|"version","cliName","version","path","text"}}`                                 | stdout | 0    | `--help` / `--version` in agent environments (flags are prose inside `data.text`) |

A robust parser captures **both** streams and recognizes all of: `type` (intermediate event), `status` (success), `ok:false` with `error.code` (wallet-cli error), and `ok:false` with `error.kind` (framework error).

---

## Intermediate events (stdout, JSON mode, before the final envelope)

### device-state

```json
{ "type": "device-state", "command": "<command>", "network": "<network>", "account": "<label>", "state": { "code": "<DeviceStateCode>", "reason": "<optional>" }, "message": "<what the human should do>" }
```

Non-terminal device progress. `awaiting_approval` carries `reason`: `sign` | `verify_address` | `open_app` | `unlock`. Relay `message` to the human and keep the process running.

### pre-verify-address

```json
{ "type": "pre-verify-address", "command": "receive", "network": "<network>", "account": "<label>", "address": "<derived address>" }
```

Emitted by `receive` before on-device confirmation, so the agent can show the human the address to compare against the trusted display.

---

## Error codes (`WalletCliErrorCode`)

`retryable: true` means the identical invocation may be retried once the transient condition clears. `retryable: false` means do not retry until the cause is fixed — and for `rejected`, never auto-retry at all.

### Device codes (`code` mirrors the DeviceState taxonomy)

| Code                  | Exit | Retryable | `details`             | Meaning / action                                                                          |
| --------------------- | ---- | --------- | ---------------------- | ------------------------------------------------------------------------------------------ |
| `rejected`            | 2    | false     | —                      | The human refused on the device. Never auto-retry; ask whether to retry or abort.         |
| `disconnected`        | 3    | true      | —                      | Device unplugged / powered off mid-command. Check cable or Bluetooth, unlock, retry.      |
| `wrong_app`           | 4    | false     | `{expected, found?}`   | Wrong app open. Ask the human to open `details.expected`, then retry.                     |
| `app_not_installed`   | 5    | false     | `{appName}`            | Required app missing. Install `details.appName` via Ledger Live first.                    |
| `timeout`             | 6    | true      | —                      | Device wait expired (`--device-timeout`, default 60000 ms). Confirm presence, retry — duplicate-spend check first if a sign was in flight. |
| `locked`              | 7    | true      | —                      | Device locked. Ask the human to unlock with their PIN, then retry.                        |
| `exchange_app_needed` | —    | true      | —                      | Non-terminal: the Exchange app must be opened on the device; surfaces as a `device-state` event, not a final error. |
| `awaiting_approval`   | —    | true      | —                      | Non-terminal: normally an intermediate `device-state` event, not a final error.           |
| `unknown`             | 1    | false     | —                      | Unclassified. Inspect `message`; do not blind-retry.                                      |

### Usage codes (your invocation is wrong — exit 64, never retryable)

| Code                    | Exit | Retryable | Meaning / action                                                                     |
| ----------------------- | ---- | --------- | -------------------------------------------------------------------------------------- |
| `unknown_flag`          | 64   | false     | Flag not recognized for this command (typos hard-fail; nothing was executed). Fix the spelling — never guess another flag. |
| `invalid_flag_value`    | 64   | false     | Flag value failed validation. Fix the value. (Reserved: the framework `validation` shape reports this today.) |
| `missing_required_flag` | 64   | false     | A required flag was omitted. Supply it.                                               |
| `unknown_command`       | 64   | false     | No such command. (Reserved: the framework `command-not-found` shape reports this today.) |
| `invalid_transport`     | 64   | false     | `WALLET_CLI_TRANSPORT` is not `usb` or `ble`. Fix or unset the env var.               |

### Resolution codes

| Code                      | Exit | Retryable | `details`                                       | Meaning / action                                                                  |
| ------------------------- | ---- | --------- | ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `account_not_found`       | 1    | false     | `{label}`                                        | Session label unknown. List labels with `session view`; run `account discover`.   |
| `raw_descriptor_rejected` | 1    | false     | —                                                | Raw descriptors are not accepted as CLI arguments. Use a session label.            |
| `session_corrupt`         | 1    | false     | `{path}`                                         | `session.yaml` failed to parse. Run `session reset`, then re-discover.             |
| `device_not_found`        | 3    | true      | `{selector, candidates}` when a selector matched nothing | No reachable Ledger. Plug in / power on, unlock, enable Bluetooth on Flex/Stax.    |
| `device_ambiguous`        | 64   | false     | `{candidates: [{id, name, model, transport}]}`  | Several devices match (or none was selected). Re-run with `--device <id>` from `details.candidates`. |
| `ble_dependency_missing`  | 64   | false     | —                                                | BLE requested but the optional `@abandonware/noble` dependency is not installed. Install it or use USB (`WALLET_CLI_TRANSPORT=usb`). |
| `swap_quotes_unavailable` | 1    | false     | — (`provider_errors[]` on the error object)      | No provider returned a quote. Inspect `provider_errors`; retry later or change the pair. |

---

## Exit codes

| Exit      | Meaning                       | Codes mapped here                                                                                                          |
| --------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 0         | success                       | —                                                                                                                          |
| 1         | generic / unclassified        | `unknown`, `account_not_found`, `raw_descriptor_rejected`, `session_corrupt`, `swap_quotes_unavailable`                    |
| 2         | rejected on device            | `rejected` — **only** a human refusal on the device maps here                                                              |
| 3         | device unreachable            | `disconnected`, `device_not_found`                                                                                         |
| 4         | wrong app open                | `wrong_app`                                                                                                                |
| 5         | app not installed             | `app_not_installed`                                                                                                        |
| 6         | device timeout                | `timeout`                                                                                                                  |
| 7         | device locked                 | `locked` (changed from 6, which it previously shared with `timeout`)                                                       |
| 64        | usage error                   | `unknown_flag`, `invalid_flag_value`, `missing_required_flag`, `unknown_command`, `invalid_transport`, `device_ambiguous`, `ble_dependency_missing` |
| 130 / 143 | SIGINT / SIGTERM              | —                                                                                                                          |

Dispatch on `error.code` when stdout is available; the exit code is the lossy fallback.

---

## Per-command JSON success data keys

| Command              | Data keys in the success envelope                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| `balances`           | `balances: [{asset, amount}]`                                                                       |
| `operations`         | `operations: [...]`, `nextCursor?`                                                                  |
| `receive`            | `address`, `verified`, `source: "device" \| "software-derivation"`                                  |
| `send`               | `recipient`, `amount`, `fee`, `tx_hash` — or `dry_run: true`, `recipient`, `amount`, `fee`          |
| `account discover`   | `accounts: [{label, freshAddress}]`                                                                 |
| `session view`       | `accounts: [{label, descriptor}]`                                                                   |
| `session reset`      | `removed: <n>`                                                                                      |
| `devices`            | `devices: [{id, name, model, transport}]`                                                           |
| `genuine-check`      | `genuine: true`                                                                                     |
| `swap quote`         | `quotes: [...]`, `provider_errors?`                                                                 |
| `swap execute`       | `from`, `to`, `provider`, `amount`, `transactionId`, `payload`, `operationHash`, `swapId`, ...      |
| `swap status`        | provider status fields                                                                              |

Amounts are pre-formatted human strings with ticker (e.g. `"0.5 ETH"`), not atomic integers.

---

## Device-state codes

`DeviceStateCode` values seen in `device-state` events and as `error.code` on device failures:

| Code                  | Terminal? | Notes                                                                                  |
| --------------------- | --------- | ---------------------------------------------------------------------------------------- |
| `awaiting_approval`   | no        | Waiting on the human; `reason` is `sign` \| `verify_address` \| `open_app` \| `unlock`. |
| `disconnected`        | yes       | Exit 3.                                                                                |
| `wrong_app`           | yes       | Exit 4; `details.expected` / `details.found`.                                          |
| `rejected`            | yes       | Exit 2; deliberate human refusal.                                                      |
| `exchange_app_needed` | no        | The Exchange app is required on the device; relay to the human and keep waiting.       |
| `locked`              | yes       | Exit 7 when terminal; also appears as `awaiting_approval`/`unlock` while waiting.      |
| `app_not_installed`   | yes       | Exit 5; `details.appName`.                                                             |
| `timeout`             | yes       | Exit 6.                                                                                |
| `unknown`             | yes       | Exit 1; unclassified.                                                                  |

---

## Parser recipe

```text
for each line of stdout (NDJSON):
  obj = parse JSON
  if obj.type == "device-state":        relay obj.message to the human; keep waiting
  elif obj.type == "pre-verify-address": show obj.address to the human for comparison
  elif obj.status == "success":          final success — read per-command data keys
  elif obj.ok == false:                  final error — dispatch on obj.error.code;
                                         auto-retry only if obj.error.retryable is true
                                         (and NEVER for code "rejected")
also read stderr:
  framework JSON ({"ok":false,"error":{"kind":...}}) for validation / unknown-command failures
on empty stdout: fall back to the exit-code table
```

---

## Environment variables

| Variable               | Effect                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| `WALLET_CLI_TRANSPORT` | `usb` \| `ble`. Unset = infer from the selected device (adds a scan). Invalid value: exit 64, `invalid_transport`. |
| `WALLET_CLI_DEVICE`    | Device selector fallback when `--device` is absent (the flag wins). Transport-id exact/prefix or case-insensitive name substring. |
| `USER_ID`              | Defaults to `wallet-cli` so the DMK firmware-distribution salt stays stable.                                 |
| `DEBUG=wallet-cli`     | Debug lines on stderr.                                                                                       |
| Agent-detection vars   | `CLAUDECODE`, `CLAUDE_CODE`, `CURSOR_AGENT`, `CODEX_ENABLED`, `GEMINI_CLI`, `OPENCODE`, `AMP_CURRENT_THREAD_ID` — read (never set) to disable spinners and render help/errors as JSON. |
