---
name: detect-data-leaks
description: Detect new PII leaks introduced by the current branch. Use when asked to check for potential data leaks for the current changes.
---

# Scope — what is PII, what is NOT

We only consider PII that is sent to third-party services. Any call to our own backend with PII is not considered a data leak.

Every third-party service should be considered, but each has a different risk level. Logging services are the highest risk.

Some information is only PII in context — for example, public addresses are not PII by themselves, but on a logging service such as Datadog, an address can be linked to a location and device, allowing identification of the person behind it.

Crash reports need to be studied alongside logs — they are a common source of data leaks.

Any service that queries the blockchain for an address is **not** a concern — the query is mandatory for the system to function and the data is not linked to any other identifiable information. This applies to all coin modules. Examples:

- Kaspa → `api.kaspa.org`
- EVM (Ethereum, BSC, Polygon…) → Etherscan-family
- Tron → TronGrid (`api.trongrid.io`)

# Known third-party sinks in this repo

Prioritize these, but do not exclude others:

- Datadog
- Sentry
- Mixpanel

Analytics also leave from the monorepo layers (`shared/`, `domain/`, `features/`, `devtools/`), not only the apps:

- `@shared/analytics` owns `track()` and `trackPage()`; `@shared/analytics-react` wraps them in `<Track>`, `<TrackPage>` and `<TrackScreen>`. The apps plug their vendor (`setAnalytics`) and filters into this pipeline, so a layer call reaches the same vendor as an app call.
- Feature packages send events either through those functions (`@features/flow-fear-and-greed`, and `@features/platform-pay-analytics`, which builds `createPayAnalyticsHelper` on `@shared/analytics`'s `track`) or through an adapter the app injects (`createContactsAnalyticsHelper` in `@features/flow-contacts`). For an injected adapter, read the app side that builds it: that is where the payload reaches the vendor.
- `@features/platform-coin-observability` decides when coin errors reach Datadog.

# High-risk variables

Treat any of these as high-risk when found in added lines:

`location.pathname`, `window.location.hash`, `address`, `walletAccountId`, `txId`, `publicKey`, `signature`, `rawData`, `payinAddress`, `fromAccountAddress`, `toAccountAddress`, `binaryPayload`

# Process

1. Run `git diff develop...HEAD`. This is the primary source — start here, not from grep.

2. In added lines, identify:
   - Assignments of high-risk variables (see above)
   - New calls to third-party sinks or wrappers: `track()`, `trackPage()`, `<Track>`, `<TrackPage>`, `<TrackScreen>`, analytics adapter methods (`adapter.track()`, `analytics.trackPage()`, `track*()` helpers), `logger.*()`, `captureException()`
   - Added lines under `shared/`, `domain/`, `features/` and `devtools/` count as much as added lines under `apps/`

3. In removed lines, identify:
   - Removed guards: `confidentialityFilter`, scrubbing calls, PII-stripping wrappers — flag each removal as a potential leak enabler.

4. For each high-risk variable in added lines, trace its lineage:
   - Check if it flows into a sink call within the diff
   - If it may pass through intermediate calls, read the affected file to follow the chain

5. For each new sink call in the diff:
   - Read surrounding context in the file
   - Follow the call chain to determine what gets serialized
   - If the call is a wrapper (e.g. `track()`), read its implementation — do not assume from the name

6. Use the grep commands below only to trace a pattern already found in the diff. Never run them independently to source findings.

7. Score each finding 1–10. Report only those scoring 7 or higher with a concrete fix.

# Grep helpers (investigation only)

`SRC` covers the apps and the layers that ship runtime code; `support/` holds development-only presets and never sends data.

```bash
SRC=(apps shared domain features devtools)
```

**Analytics call sites in the layers:**
```bash
grep -rnE "\btrack(Page)?\(|<Track(Page|Screen)?\b" shared domain features devtools --include="*.ts" --include="*.tsx" \
  | grep -vE "\.test\.|/__tests__/|/node_modules/"
```

**`location.pathname` flowing into `track()`** — pathname often assigned before the call:
```bash
find "${SRC[@]}" -path "*/node_modules" -prune -o \( -name "*.ts" -o -name "*.tsx" \) -print | grep -vE "\.test\.|/__tests__/|/tests/" | \
  xargs perl -0777 -ne 'BEGIN { exit unless @ARGV } print "$ARGV\n" if /track(?:Page)?\([\s\S]{0,500}?location\.pathname/'
```

**`window.location.hash` in analytics:**
```bash
grep -rn "window\.location\.hash" "${SRC[@]}" --exclude-dir=node_modules --include="*.ts" --include="*.tsx"
```

**Address interpolated into `new Error(...)` in coin modules:**
```bash
find libs \( -name "*.ts" -o -name "*.tsx" \) | grep -vE "live-e2e-shared|coin-tester-modules|__tests__|tests|\.test\." | \
  xargs perl -0777 -ne 'BEGIN { exit unless @ARGV } print "$ARGV\n" if /new Error\(`[\s\S]{0,300}?\$\{[^}]*(address|sender|hash|walletAccountId|txId|publicKey)[^}]*\}/i'
```

**Signed tx payload on broadcast failure:**
```bash
grep -rn -E "broadcast_failure|broadcastLogger" "${SRC[@]}" --exclude-dir=node_modules --include="*.ts" | grep -v "\.test\."
```

**Full transaction object spread into analytics:**
```bash
grep -rn -E "value:[[:space:]]*(params|transaction)\b" "${SRC[@]}" --exclude-dir=node_modules --include="*.ts" --include="*.tsx" \
  | grep -v "\.test\." \
  | grep -vE "value:[[:space:]]*(params|transaction)\."
```

**Signed payload fields in `track()`:**
```bash
grep -rn -E "binaryPayload|payinAddress|fromAccountAddress|toAccountAddress" libs "${SRC[@]}" --exclude-dir=node_modules --include="*.ts" --include="*.tsx" \
  | grep -vE "\.test\.|/__tests__/|/tests/"
```

**Props filter registration (the shared pipeline applies it to both `track()` and `trackPage()`):**
```bash
grep -rn "setPropsFilter(" apps/ --include="*.ts" --include="*.tsx" | grep -v test
```
`setPropsFilter` lives in `@shared/analytics`; only an app registers one. Desktop registers `confidentialityFilter`, so a layer call site rendered on mobile is unfiltered. Check whether any other app that sends analytics needs a filter.

# Output format

- Score mapping: 9-10 → 🔴 Critical, 7–8 → 🟡 Suggestion. Scores below 7 are not reported.
- If no findings reach score 7, produce no output.

```
🔴 Critical (10/10) — apps/.../useActivityIndicator.ts:39
track("SyncErrorList", { page: location.pathname, ... });
Fix: remove `page` from the payload or replace with a static route label stripped of account IDs.

🟡 Suggestion (8/10) — apps/.../someFile.ts:12
track("Event", { hash: window.location.hash });
Fix: pass only the route segment before the `#`, not the full hash.
```

# References

`.agents/skills/client-ids/SKILL.md`
