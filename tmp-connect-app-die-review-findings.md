# Connect App in DIE — Review Findings

This document is a companion backlog for `tmp-connect-app-die-implementation-plan.md`.

Review basis:

- the implementation plan itself
- Confluence pages:
  - `Connect App in DIE study`
  - `Connect App UI spec`
  - `Connect App - product specification (current implementation)`
- current code in `libs/device-intent`, `libs/ledger-live-common`, `libs/live-dmk-shared`, and the current mobile/desktop `DeviceAction` renderers

Goal:

- track review findings as actionable items,
- resolve them progressively,
- fold the resolved decisions back into the main plan so the plan remains the primary source of truth.

Recommended workflow:

1. Pick one finding.
2. Decide whether it must be fixed in the plan, clarified, or explicitly deferred.
3. Update `tmp-connect-app-die-implementation-plan.md`.
4. Mark the finding as resolved here with a short note.

## Status legend

- `open` — not resolved yet
- `in-progress` — currently being addressed
- `resolved` — reflected in the main plan
- `deferred` — intentionally postponed and explicitly called out in the main plan

## Findings

- No open findings remaining.

## Notes / Assumptions

- The plan already calls out the temporary mobile-only Nano S Aptos/Hedera deprecation as out of scope. That is acceptable for the debug-first phase, but any later migration of real mobile callers will need an explicit preservation story before the legacy `DeviceAction` path is retired.
- The debug executor flow is still a useful first harness, but it does not exercise all three overlooked requirements by itself, so Step 11 / Step 12 should not treat it as sufficient parity validation.

## Resolution Log

Use this section to keep a short audit trail once items start moving.

- Resolved in main plan: app-installation parity, `appNameToDependency()` parity, and explicit non-emitted init-job states are now covered by the Step 2 / Step 8 mapping contract.
- Resolved in main plan: LWM file paths, debug target files, and restart semantics for `deviceContextInitialization` are now explicit in Steps 1, 10, and 11.
- Resolved in main plan: Step 6 now documents `live-common` package wiring for `@ledgerhq/device-intent`, and Step 7 explicitly keeps `DmkCompatTransport` while acknowledging the wallet-cli adapter as reference only.
- Resolved in main plan: Step 6 now makes wrong-device validation explicitly skippable via `skipWrongDeviceCheck`, while still deriving device requirements from `appRequest.account`.
- Resolved in main plan: CTA ownership is now explicit. Callbacks that resume/control the shared init job stay in `ConnectAppInitJobState`; navigation, redirection, and external-link logic stay platform-owned in the rendering layer.
- Resolved in main plan: Step 8 now injects a required semantic `ConnectAppInitSideEffects` adapter so each platform owns persistence side effects (`deviceId`, last-seen device info, firmware metadata) without coupling the shared job to Redux.
- Resolved in main plan: the parity target is now explicitly **user-visible** parity. Blocking deprecation remains a dedicated `deprecation-block` init state as an intentional internal divergence from the legacy error-path routing, while preserving the same blocking/no-resume UX.
- Resolved in main plan: Step 9 now uses refs for volatile callbacks/settings reads so `deviceContextInitialization` remains the only intended reinitialization key.
- Resolved in main plan: `@ledgerhq/device-intent` package wiring moved up to Step 2, where `types.ts` first depends on `DeviceExtractedContext`.
- Resolved in main plan: Step 6 now uses an explicit-override-with-fallbacks rule for `currencyName`, so common flows derive it automatically while composite/app-only flows can still provide it explicitly when needed.
- Resolved in main plan: Step 2 now uses the correct `FlowName` import path and explicitly distinguishes pure initializer input types from callback-bearing interactive job-state variants.
- Resolved in main plan: Step 12 now includes lightweight MVVM coverage guidance for `DeviceContextInitialization`, including one focused integration suite plus ViewModel tests for representative states and subscription/ref stability.
- Deferred in main plan: wrong-device retry orchestration is now explicitly out of scope for the first iteration.
