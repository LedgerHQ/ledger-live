# Architecture review rules (beyond lint:arch)

CI runs `pnpm lint:arch` (`lint:boundaries`, `lint:structure`, `lint:tool-config`, `lint:i18n-keys`, and `skills:check`). Do not restate failures those targets already report. Use this file for gaps the tooling leaves to review.

## Entity state versus flow state

**Rule:** Data several flows or screens must read belongs in `domain/entity/<name>`. State only this flow owns while the journey is open stays in that flow package `src/state/` (or the flow-owned reducer). Never promote flow state to an entity just to share it.

**Why:** Entity slices are the shared vocabulary; flow state is journey-scoped. Mixing them hides coupling.

**How to check:** For new state in the diff, ask whether anything outside this flow package must read the same data. If yes, it belongs in `domain/entity`; if only this journey needs it, keep it in the flow package. Read `.agents/skills/structure-flow/SKILL.md` (entity or flow state) and `.agents/skills/flow-package/SKILL.md` (flow state versus entity state).

**Example:** A filter only `@features/flow-pay-balance` uses stays in that flow `state/`; contacts many features read live in `@domain/entity-contact`.

## One flow, one journey

**Rule:** A package under `features/flow/<use-case>` is one use case with one entry and one exit. Split at journey lines. Shared UI or logic sinks to `features/platform`, never a `common/` folder in the flow.

**Why:** Keeps journeys navigable and ownership obvious.

**How to check:** Flag a second unrelated journey in the same flow package, or a new `common/` grab-bag. Read `.agents/skills/structure-flow/SKILL.md` (one flow, one journey) and `.agents/skills/flow-package/SKILL.md`.

**Example:** Reusable contacts UI belongs in `@features/platform-contacts`, not a `common/` folder inside one flow.

## Each package owns its view of an entity

**Rule:** Two packages must not share a view type for the same entity. Each declares the shape it needs and maps from the entity; the entity package is the only shared vocabulary.

**Why:** Accidental field overlap is not a license to couple packages.

**How to check:** Flag new exported types in `features/` that duplicate entity shapes for reuse across packages without mapping from `@domain/entity-*`. Read `.agents/skills/structure-flow/SKILL.md` (each package owns its view).

**Example:** Two flows need a contact summary; each defines its props type and maps from `Contact` in `@domain/entity-contact`.

## Untagged platform-only prop

**Rule:** A prop only one implementation reads must carry `@platform web` or `@platform native` on the contract, and must meet the ADR shape (optional; `boolean`, `number`, `string`, or a string-literal union). If only the native implementation can know the value (for example a bottom inset the implementation can read with `useSafeAreaInsets()`), keep it inside that implementation, not the contract.

**Why:** The structure linter validates tagged `@platform` props; an untagged platform-only prop looks like a normal prop and passes.

**How to check:** Compare the contract to both implementations; list props each side reads. Any platform-only prop without `@platform` is a finding. See `docs/adr/universal-components.md` (Enforcement, R3 JSDoc) and `.agents/skills/universal-components/SKILL.md` (review-only checks).

**Example:** Native sheets that need bottom inset should read it in the native implementation, as the ADR shows for pay flows, instead of leaking an untagged prop.

## The outnumber heuristic

**Rule:** When `@platform` props outnumber the shared props, the component is not universal: model it with platform entries (`./web` and/or `./native`) instead of growing a lopsided contract.

**Why:** The linter does not count this ratio, so contracts can drift one prop at a time.

**How to check:** Count shared props versus `@platform` props on a universal component in the diff. If platform-tagged props dominate shared ones, request platform entries. See `docs/adr/universal-components.md` (Decision, paragraph on counting tagged props) and `.agents/skills/universal-components/SKILL.md`.

**Example:** The ADR contrasts today's two contracts with a target single contract; when the gap is structural, split by platform entry instead of patching the universal contract.

## Intent names for callbacks

**Rule:** Callback props must name user intent (`onEdit`, `onOpenContacts`, `onSelectAddress`). A name can pass the gesture filter yet still be meaningless (for example `onAction`).

**Why:** R3 rejects gesture words, not empty verbs; review closes that gap.

**How to check:** On new or renamed callbacks in `*.types.ts`, ask what the user is trying to do and whether the name says so. See `docs/adr/universal-components.md` (R3 Neutral contract, callback naming) and `.agents/skills/universal-components/SKILL.md` (review-only checks).

**Example:** Prefer `onEditContact` over `onAction` when the button edits a contact.

## Earned platform entry

**Rule:** The linter enforces R5 (one entry kind per component); it does not decide whether a platform entry was warranted. Ask whether a neutral contract was possible first.

**Why:** Platform entries are legitimate for props that cannot be neutral, but an unnecessary split widens the API for no gain.

**How to check:** When a diff adds or moves `./web` or `./native` exports, trace the ADR decision tree: both platforms need it, every required prop can be neutral, universal entry; otherwise platform entries. See `docs/adr/universal-components.md` (Decision, three shapes) and `.agents/skills/universal-components/SKILL.md`.

**Example:** `@shared/lottie` uses separate entries because web and native props and assets differ; a small presentational control rarely earns a platform-only export.
