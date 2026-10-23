# wallet-cli - business logic

Concepts and product rules behind the wallet-cli commands. Load when the user asks _why_ something works the way it does, or when surfacing context for a safety rule that the main skill states tersely.

For the command surface, errors, sandbox/device rules, and informal-request mapping, see the main `SKILL.md` in this skill folder.

---

## Genuine check

**What it is.** A cryptographic verification that the connected device is a genuine Ledger. Genuine Ledger devices hold a private key embedded during manufacturing - only a device with that key can produce the proof required by the check. The device signs a challenge; Ledger verifies the result.

**When to run it.**

- First time a user connects a device through wallet-cli.
- Before any high-value flow (large `send`, swap, key-share export).
- After a device has been out of the user's possession.

**What it does _not_ prove.**

- That the device has not been physically tampered with (anti-tamper is a separate concern).
- That the seed phrase backup is intact.
- That the firmware running on the device is the latest version.

---

## Receive-address verification on the trusted display

The host machine cannot be trusted: malware can swap a clipboard, intercept the CLI output, or render a different address than the one the device actually derived. The Ledger screen is the only display the user can trust - that's why the CLI always asks the user to compare, and why a mismatch must be treated as a possible compromise rather than a glitch.

---

## Sessions

**What a session is.** A persisted record of which accounts the CLI has discovered on the connected device. `account discover` populates the session; `session view` shows it; `session reset` clears it.

**What a session is _not_.** It is not authorization. It is not signing material. It is not synced across machines. Re-running `account discover` on a different machine produces the same accounts (deterministic from the seed), but the session itself is local.

**A passphrase changes the seed.** After a user adds a BIP-39 passphrase, the derived accounts change and the existing session is no longer valid. Reset and re-discover.

---

## Sandbox bypass

The Claude Code sandbox blocks USB syscalls by default, so any wallet-cli command that needs the device hardware can't reach it from inside the sandbox - that's why device-touching commands require `dangerouslyDisableSandbox: true`. Commands that only hit Ledger's backend don't need USB and don't need the bypass.

---

## Device contention

The USB HID channel to a Ledger device does not multiplex. Two concurrent wallet-cli processes will both try to drive the secure channel and corrupt each other's APDU exchange. This applies even to seemingly read-only flows like `genuine-check`, which opens the secure channel just like signing flows do.

---

## Solana stake minimum

Each Solana stake account must delegate at least the network minimum (`getStakeMinimumDelegation`, currently 1 SOL on mainnet). Creating one also locks the stake account rent (~0.0017 SOL) and a fee reserve for this transaction and the later undelegate and withdraw, on top of the SOL the account already holds back (its own rent reserve and the unstake fees for existing stakes). An account that holds only about 1 SOL cannot `earn deposit` on Solana at any amount, so do not retry smaller amounts: the error states the minimum, the max stakeable amount, and how much more SOL the account needs.

---

## Two trust models: ring and Agent Intent

wallet-cli holds two kinds of credentials for the human. Each comes from its own enrollment, and neither reaches into the other.

| | `ring` | Agent Intent |
|---|---|---|
| This machine holds | member key of LKRP application 17 | one software secp256k1 key per profile, created on this machine |
| Created by | `ring init`, approved on the device | `agent-intent enroll` with no device; the human approves the link on their Ledger |
| At rest | OS keychain, wrapped with the human's password (`WALLET_PASS`) | OS keychain, no password; on Linux without a usable one, and only after the human agrees, an unencrypted 0600 key file in the state dir |
| Grants | per-name keys that encrypt and decrypt files and text | membership of the agent's own Trustchain (LKRP application 18): signing in to the Agent Intent service, proposing payments and swaps, and reading or cancelling its own proposals; plus read access to the human's Ledger Sync stream (application 16): the synced account list, public data only |
| Teardown | `ring destroy` | no CLI command |

What keeps them apart:

- **Separate keychain entries** under the `ledger-wallet-cli` service (`member-private-key-…`, `agent-intent-key-…`); agent key files live in their own `agent-intent-keys/` directory. No destroy or reset flow of one touches the other, and `session reset` keeps both.
- **Separate LKRP applications.** The agent key is added to application 18 and, at enrollment, to the human's application 16 stream. It never receives `ring`'s application 17 domain keys, so it cannot decrypt `ring` data.
- **Nothing trusted from the relay alone.** The approval reaches `enroll` over an encrypted relay, and wallet-cli proves it before saving: the agent key must obtain an application 18 access token for the claimed Trustchain and authenticate to the claimed application 16 stream with the expected permission. Only then are the Trustchain ID and the non-secret account access references written.
- **Pinned environments.** Each Agent Intent profile records `staging` or `production`, and `enroll` rejects an approval for the other one.
- **The seed stays on the Ledger** in both. The keys rest differently on Linux without a Secret Service provider. `ring`'s keychain entry is not pinned to the Secret Service, so its member key lands in the kernel keyring instead, where any process under the same uid can read it and a reboot loses it. The agent key is pinned: `enroll` checks for a Secret Service before it saves the key and stops with `keychain_unavailable`, and the key file it writes only after the human agrees (agent-intent.md, step 2) is readable by any process under the same uid too.

The result: a leaked agent key lets someone propose payments and swaps as the agent, read or cancel its proposals, and read the human's synced account list, but not decrypt `ring` data. Neither key can sign a transaction.

To cut an agent off, the human removes it from their Ledger Sync instances in Ledger Wallet, which ends its account list access (`sync` then reports "no longer has Ledger Sync access"), and stops approving its intents. No wallet-cli command revokes a profile.

---

## Why an Agent Intent proposal is safe and what the fingerprint protects

**The agent proposes; the human's Ledger decides.** `agent-intent send` and `agent-intent swap` sign the proposal with the profile key, submit it and return a review link. Funds move only after the human opens that link and approves on their Ledger. A leaked agent key reaches only what "Two trust models" above lists and never moves funds, which is why the agent's machine needs no device and why Agent Intent suits cloud agents.

**The device screen is the last check.** A prompt-injected agent can propose a transfer to an attacker under a plausible `--description`. The description is the agent's own text; the recipient and amount on the device are what gets signed. wallet-cli does not check the sender's balance either: that is the reviewer's job. A skill is not a security boundary, since an agent can ignore any rule in it. Device approval is the boundary.

**What the signed link proves.** `enroll` signs the link's fields (public key, name, description, source, expiry, relay channel) with the new agent key. The frontend verifies that signature and refuses an altered link ("This enrollment link has been changed or is not authentic.") or an expired one. A link built around a different key still verifies, because anyone can sign a link with their own key.

**What the fingerprint adds.** The fingerprint is derived from the agent's public key: SHA-256 of the compressed key, first 10 bytes, base58, in groups of 4 characters. The agent sends it next to the link, and the enrollment flow shows the fingerprint of the key inside the link. A match means the human approves the key this agent holds, not a key swapped into the link on its way to them. `agent-intent show` prints the same fingerprint for any profile later.

**What neither protects against.** A compromised agent can print a phishing link together with the matching fingerprint of its own key, and both checks pass. The fingerprint secures the path from agent to human, not the agent itself. Device approval protects the human only on Ledger's real page (agent-intent.md, step 11, One host, names it).

**Why no blind retry.** Each run signs a fresh nonce, so after a timeout or a server error a retry proposes a second intent even when the first one landed, and the human gets two to review. `agent-intent intents` shows what landed; a swap's entry has no recipient or amount, so the agent matches by type and sender (agent-intent.md, step 11, No blind retry).
