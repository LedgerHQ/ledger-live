# Notifications Prompt DDD PoC

## Resolved Questions

- Should the domain engine depend on Firebase `AuthorizationStatus`? No. Platform code maps platform-specific permission values to a domain-level `NotificationPermissionStatus`.
- Should the domain engine consume raw feature flag objects? No. Platform code maps feature flags to a domain-level `NotificationPromptPolicy`.
- Where do drawer CTA side effects live? The flow emits `NotificationPromptIntent`s, platform orchestrates side effects, and domain exposes history mutations.
- Where should analytics mapping live? Platform tracks analytics from structured domain decision payloads.
- Which package names should the PoC use? Use the real target names: `@domain/entity-notification-prompt`, `@features/platform-notification-prompt`, and `@features/flow-notification-prompt`.
- Which library should domain use for date manipulation? None for this PoC. The copied engine uses a small native `Date` duration helper so the domain package does not inherit mobile/platform dependencies such as `date-fns`.
- Where should `NotificationsPromptProvider` live? In flow. The flow package owns the reusable context/provider API; mobile keeps a thin composition adapter that supplies app-specific trigger callbacks.
- Where does persisted prompt history migration live? The pure history mutation/backfill helpers live in domain. The storage adapter lives in platform and receives the app storage implementation from mobile.

## Considered Propositions

- Analytics in platform: keeps `track()` and app concerns out of domain while avoiding hidden rule logic in UI.
- Analytics in flow: simple for visible drawer events, but skipped prompt attempts never render UI.
- Analytics in domain: keeps payloads close to decisions, but leaks analytics vocabulary into business logic.
- Analytics in app: pure package boundaries, but likely scatters feature tracking glue across apps.
- `date-fns` in domain: preserves the current app helper exactly, but adds a dependency for one duration addition operation.
- Native `Date` helper in domain: keeps the package dependency-light while preserving the current prompt schedule semantics for months, days, hours, minutes, and seconds.

## Target Package Tree

```text
domain/entity/notification-prompt/
  package.json
  src/
    data/
      schema.ts
      schema.test.ts
      schema.mock.ts
      slice.ts
    logic/
      engine.ts
      engine.test.ts
    index.ts

features/platform/notification-prompt/
  package.json
  src/
    analytics/
    bootstrap/
    permissions/
    storage/
    policy/
    hooks/
    index.ts

features/flow/notification-prompt/
  package.json
  src/
    components/
      NotificationsPromptProvider/
    screens/
    state/
      slice.ts
    index.ts
```

## Responsibility Boundaries

- `@domain/entity-notification-prompt` owns `NotificationPromptHistory`, `NotificationPermissionStatus`, `NotificationPromptPolicy`, pure eligibility decisions, selectors, and persisted history mutations.
- `@features/platform-notification-prompt` owns mobile/platform adapters: feature flag mapping, Firebase permission mapping, storage IO, analytics tracking, bootstrap, and side-effect orchestration.
- `@features/flow-notification-prompt` owns visible drawer UI, drawer-local Redux state, and user intent emission.
- `apps/ledger-live-mobile` keeps app screen/routing composition and existing compatibility imports during the copy-only PoC.

## Import Rules

- Domain imports only domain/entity peers and shared packages.
- Platform imports domain and shared packages, but not flow UI.
- Flow imports platform, domain, and shared packages.
- Existing `LLM/features/NotificationsPrompt` keeps app composition and legacy compatibility exports while the new trigger path uses domain/platform decisions. It should not re-export copied domain rules or platform storage helpers.

## Copy-Only Scope

- Copy and normalize the domain engine into `@domain/entity-notification-prompt`.
- Add Zod schema, initial state, and mock builder for `NotificationPromptHistory`.
- Replace Firebase authorization values in copied domain code with `NotificationPermissionStatus`.
- Replace raw feature flag inputs in copied domain code with `NotificationPromptPolicy`.
- Scaffold `@features/platform-notification-prompt` with policy and permission adapters.
- Scaffold `@features/flow-notification-prompt` with drawer-local state and intent emission.
- Keep visible UI and deeper runtime app wiring as blueprint-only in this PoC pass.

## Done Criteria

- New domain package has runnable schema and engine tests.
- Existing mobile feature behavior remains untouched while copied prompt rules/storage helpers are removed from the app folder.
- The PoC exposes whether the domain model can carry the current prompt rules without importing mobile/platform concerns.

