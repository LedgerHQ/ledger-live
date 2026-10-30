# Ledger Key Ring (ring): encrypt files and text with a Ledger

`ring` encrypts files and text with keys rooted in the human's Ledger. `ring init` provisions the ring once per machine through the Ledger Sync app on the device. After that, `encrypt` and `decrypt` run without the device: each `--key` name derives its own AES-256-GCM key (HKDF-SHA256 from the ring root), and every run calls the Ledger Key Ring backend to restore the ring, so the network is required. The ring is recoverable from the seed on any new machine.

Exact flags: `pnpm --silent wallet-cli start ring <init|encrypt|decrypt|keys|destroy> --help`.

## Password: WALLET_PASS from the OS keychain

`ring init`, and `encrypt`, `decrypt` and `destroy` on a password-protected ring, read the password from `WALLET_PASS` whenever it is set, and only otherwise prompt on the terminal. Your shell has no terminal, so you always inject `WALLET_PASS`, and only through command substitution from the human's OS keychain:

```bash
# macOS
WALLET_PASS=$(security find-generic-password -a default -s ledger-wallet-cli -w) pnpm --silent wallet-cli start ring encrypt ...
# Linux (Secret Service)
WALLET_PASS=$(secret-tool lookup service ledger-wallet-cli account default) pnpm --silent wallet-cli start ring encrypt ...
# Windows (PowerShell)
$env:WALLET_PASS=(Get-StoredCredential -Target ledger-wallet-cli).GetNetworkCredential().Password; pnpm --silent wallet-cli start ring encrypt ...
```

- **The human owns the secret.** When the keychain has no entry yet, ask the human to store the password once themselves (`security add-generic-password -a default -s ledger-wallet-cli -w` on macOS, `secret-tool store --label=ledger-wallet-cli service ledger-wallet-cli account default` on Linux; both prompt for the value). A throwaway test password goes into the keychain the same way.
- **Only the substitution appears in your commands.** A literal password in a command, flag or tool call (`WALLET_PASS=hunter2 ...`), test passwords included, leaks into shell history, `ps` output, CI logs and your transcript.
- Even substituted, the value sits in the child process environment, readable with `ps eww` by the same user. That is acceptable; keep it out of logs and `--output json` sinks.
- **Provision with a password.** `ring init` also has `--unsecure-no-password`, which stores the member key unencrypted in the keychain. You never pass it; a human who wants it runs it themselves.

## Init (device, once per machine)

```bash
WALLET_PASS=$(<keychain lookup>) pnpm --silent wallet-cli start ring init --name my-laptop
```

- `--name` is the member name shown in the ring (default: hostname and platform).
- The device opens the Ledger Sync app and the human approves on it. `ring init` sets up the machine that runs it, so on a machine with no USB the ring cannot be initialized here: handing the human the command would set up their computer instead (SKILL.md, "No USB on this machine").
- Done when the command exits 0 and `pnpm --silent wallet-cli start ring keys` runs without `not initialized`.

## Encrypt and decrypt

```bash
# files
WALLET_PASS=$(<keychain lookup>) pnpm --silent wallet-cli start ring encrypt --key my-oss-project -i .publish-tokens -o .publish-tokens.enc
WALLET_PASS=$(<keychain lookup>) pnpm --silent wallet-cli start ring decrypt --key my-oss-project -i .publish-tokens.enc -o .publish-tokens
# text through stdin and stdout (clipboard pattern)
pbpaste | WALLET_PASS=$(<keychain lookup>) pnpm --silent wallet-cli start ring encrypt --key personal-notes | pbcopy
pbpaste | WALLET_PASS=$(<keychain lookup>) pnpm --silent wallet-cli start ring decrypt --key personal-notes | pbcopy
```

- **`--key` names the key.** 1 to 253 characters, no whitespace, free-form: project slugs (`my-oss-project`), environment tags (`openClaw-prod`), notebooks (`personal-notes`). Decrypt needs the exact name used at encrypt. `pnpm --silent wallet-cli start ring keys` lists the names this machine has used (local cache, no network).
- **`-o` is `--out`, a file path.** `--output` is the format (`human` or `json`), and `--output json` requires `--out`, since binary data cannot go to stdout as JSON.
- Without `-i`, the input comes from stdin, which must be piped.
- Output files are written with mode 0600.

**Decrypted output is a secret.** Route plaintext straight to its destination: a file with `-o` (written 0600) or the clipboard pipe above. To feed another program, decrypt to a file with `-o`, then run that program on the file in its own call inside the sandbox: the bypassed call holds only the `wallet-cli` line (SKILL.md, Host sandbox), and a shell variable does not survive into the next call. Leave it unread: printing it to the terminal or running `cat` on the decrypted file puts the secret into your transcript, logs and scrollback.

## Rotation

The ring's keys derive from an encryption key that rotates whenever a member is removed from the ring. Data encrypted before a rotation can no longer be decrypted: the CLI prints `⚠ Ledger Key Ring rotated since last use` and `decrypt` fails with `wrong key name, corrupted data, or the Ledger Key Ring rotated`. Tell the human; after removing a member they re-encrypt the affected data under the current ring while they still hold the plaintext.

## Destroy

`ring destroy` tears down the ring remotely and wipes this machine's member key. Run it only when the human asks for it. It asks the human to type `destroy` at a prompt, so hand the human the command to run in their own terminal, where they answer both the confirmation and the password prompt.

- A wrong password aborts with no changes. So does a `WALLET_PASS` that is set but empty (a failed keychain lookup): it counts as a mistake, never as a skip, so the remote ring is never orphaned.
- Pressing Enter at the interactive password prompt skips the remote teardown and wipes only the local credentials.
- A failed remote teardown (network, backend) changes nothing locally; re-run when connectivity is back.

## Errors

| Message | Cause | Action |
|---|---|---|
| `Ledger Key Ring not initialized` | no ring on this machine | `ring init` (device) |
| `Ledger Key Ring already initialized` | ring exists | use it; reset only when the human asks, with `ring destroy` |
| `A member credential already exists in the OS keychain but this session has no Ledger Key Ring metadata` | stray key, e.g. after `session reset` | the human runs `ring destroy` (wipes the stray key locally), then `ring init` |
| `Lost the race` | another process initialized the ring meanwhile | tell the human this device is still registered as a member remotely; they can remove it from another member or from Ledger Live |
| `Password required but no TTY available and WALLET_PASS is not set` | no password source | inject `WALLET_PASS` as above |
| `WALLET_PASS is set but empty` | keychain lookup returned nothing | check the keychain entry with the human |
| `wrong key name, corrupted data, or the Ledger Key Ring rotated` | different `--key`, damaged file, or rotation | confirm the key name with the human; otherwise see Rotation |
| `--output json requires --out <file>` | JSON format without an output file | add `-o <file>` or drop `--output json` |
| `No input: provide --input FILE or pipe data to stdin` | no `-i` and nothing piped | pass `-i` or pipe the data |
| `Remote teardown failed (network/backend). No local changes made` | destroy could not reach the backend | retry later |
