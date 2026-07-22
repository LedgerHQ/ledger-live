---
name: detect-data-leaks
description: Check the current branch for potential data leaks of PII in the codebase. Use when asked to check for potential data leaks for the current changes.
---

# Scope — what is PII, what is NOT

We only consider PII that is sent to third-party services. Any call to our own backend with PII is not considered a data leak.

Every third-party service should be considered, but each has a different risk level. Logging services are the highest risk.

Some information is only PII in context — for example, public addresses are not PII by themselves, but on a logging service such as Datadog, an address can be linked to a location and device, allowing identification of the person behind it.

Crash reports need to be studied alongside logs — they are a common source of data leaks.

Any service that queries the blockchain for an address is **not** a concern — the query is mandatory
for the system to function and the data is not linked to any other identifiable information. This
applies to all coin modules. Examples of this pattern (not an exhaustive list):

- Kaspa → `api.kaspa.org`
  ```
  libs/coin-modules/coin-kaspa/src/network/getTransactions.ts
  const url = new URL(`/addresses/${encodeURIComponent(address)}/full-transactions-page`, API_BASE);
  ```
- EVM (Ethereum, BSC, Polygon…) → Etherscan-family
  ```
  libs/coin-modules/coin-evm/src/network/explorer/etherscan.ts
  `${explorer.uri}?module=account&action=txlist&address=${params.address}`
  ```
- Tron → TronGrid (`api.trongrid.io`)
  ```
  libs/coin-modules/coin-tron/src/network/index.ts
  `${getBaseApiUrl()}/v1/accounts/${addr}/transactions`
  ```

# Known third-party sinks in this repo

A majority of leaks found come from these — do not exclude others, but prioritize:

- Datadog
- Sentry
- Mixpanel

# Known risky patterns

1. **`location.pathname` as an analytics property** — embeds account ID on account routes

   pathname is often assigned to a variable before being passed to `track()`, so same-line matching
   produces false negatives. Slurp each file as one string with `perl -0777`:
   ```bash
   find apps \( -name "*.ts" -o -name "*.tsx" \) | grep -vE "\.test\.|/__tests__/|/tests/" | \
     xargs perl -0777 -ne 'BEGIN { exit unless @ARGV } print "$ARGV\n" if /track(?:Page)?\([\s\S]{0,500}?location\.pathname/'
   ```
   The `{0,500}` cap prevents matching a `track()` with an unrelated `pathname` far away.
   Read each returned file to trace the actual flow.

2. **`window.location.hash` as an analytics property** — hash router encodes the full account route on Desktop
   ```bash
   grep -rn "window\.location\.hash" apps/ --include="*.ts" --include="*.tsx"
   ```

3. **Address interpolated into an error message** — template literals inside `new Error(...)` in coin modules

   ```bash
   find libs \( -name "*.ts" -o -name "*.tsx" \) | grep -vE "live-e2e-shared|coin-tester-modules|__tests__|tests|\.test\." | \
     xargs perl -0777 -ne 'BEGIN { exit unless @ARGV } print "$ARGV\n" if /new Error\(`[\s\S]{0,300}?\$\{[^}]*(address|sender|hash|walletAccountId|txId|publicKey)[^}]*\}/i'
   ```

4. **Signed tx payload sent to Datadog on broadcast failure** — `signature` or `rawData` are recoverable on-chain addresses
   ```bash
   grep -rn -E "broadcast_failure|broadcastLogger" apps/ --include="*.ts" | grep -v "\.test\."
   ```

5. **Full transaction object spread into analytics** — `value: params` or `value: transaction` rather than a scalar
   ```bash
   grep -rn -E "value:[[:space:]]*(params|transaction)\b" apps/ --include="*.ts" --include="*.tsx" \
     | grep -v "\.test\." \
     | grep -vE "value:[[:space:]]*(params|transaction)\."
   ```

6. **Signed payload fields in `track()` calls** — swap payload fields decodable to payout addresses
   ```bash
   grep -rn -E "binaryPayload|payinAddress|fromAccountAddress|toAccountAddress" libs/ apps/ --include="*.ts" --include="*.tsx" \
     | grep -vE "\.test\.|/__tests__/|/tests/"
   ```

7. **`confidentialityFilter` not applied to `trackPage()`**
   ```bash
   find apps/ledger-live-desktop apps/ledger-live-mobile -name "segment.ts" -path "*/analytics/*" | \
     xargs -I{} grep -n -E "confidentialityFilter|trackPage" {}
   ```

# Process

1. Check diff for the current branch via `git diff develop...HEAD`
2. Run all seven known risky pattern scans above. Cross-reference each returned file against
   `git diff develop...HEAD --name-only` — only report files that appear in the diff. Pre-existing
   issues in unmodified files are out of scope. For each in-scope file returned:
   - Read the relevant code and trace whether the flagged value actually reaches a third-party sink
3. For each new call to a third-party sink introduced in the diff:
   - Follow the call chain N levels deep to find what gets serialized
   - Retrieve the information passed to the third party
   - Check whether any PII (see Scope) is present in the payload
   - If the call is a wrapper (e.g. `track()`), read its implementation — do not assume from the name
4. List all potential leaks and score each from 1 to 10. Output only leaks with a score of 7 or higher.
5. For each reported finding, propose a concrete fix: the minimal code change that removes the PII
   from the payload while preserving the intent of the call (e.g. replace a raw address with a hashed
   or truncated identifier, strip the field entirely, or route through `confidentialityFilter`).

# Output format

Per finding, use severity emoji followed by score, file path, the offending code, and a proposed fix:

```
🔴 Critical (10/10) — apps/.../useActivityIndicator.ts:39
track("SyncErrorList", { page: location.pathname, ... });
Fix: remove `page` from the payload or replace with a static route label stripped of account IDs.

🟡 Suggestion (8/10) — apps/.../someFile.ts:12
track("Event", { hash: window.location.hash });
Fix: pass only the route segment before the `#`, not the full hash.
```

Score mapping: 10 → 🔴 Critical, 7–9 → 🟡 Suggestion. Scores below 7 are not reported.

If no findings reach score 7, produce no output.

# References

`.agents/skills/client-ids/SKILL.md`

