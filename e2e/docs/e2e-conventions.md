# Shared E2E conventions

Rules for desktop and mobile E2E tests. MUST and MUST NOT are required. SHOULD is the default, and the same section states any exception.

## Test state

### Setup MUST be deterministic

Tests MUST seed dismissed introductions, onboarding, and settings through fixtures and feature flags. Tests MUST NOT branch the flow on whether something is visible.

## Shared support

### Shared fixtures and helpers MUST live in libs/live-e2e-shared

Shared data, types, and utility functions MUST be declared in `libs/live-e2e-shared` when both desktop and mobile use them. Client-specific logic MUST stay in the desktop or mobile directory.

### A timeout, delay, or poll interval MUST be a bucket

A timeout MUST be a `TIMEOUT` bucket, and a delay, poll interval, or pause between attempts an `INTERVAL` bucket, from [`@ledgerhq/live-e2e-shared/timeouts`](../../libs/live-e2e-shared/src/timeouts.ts) (mobile re-exports them from `utils/timeouts.ts`), not a bare number. A named constant MUST NOT be added unless no bucket fits, such as a per-test budget above the largest bucket or a partner's server-side wait, and it MUST state its reason. It lives in the file that uses it, or in the client's timeouts file when several files do. A config file MAY keep a literal, since the key already names it (`setupTimeout` in `detox.config.js`, the test timeout in `playwright.config.ts`). Feature-flag params such as `pollingInterval` configure the app, not a wait, so this rule does not apply to them.

```ts
await this.screen.waitVisible(TIMEOUT.small); // not 5000
```

### Ambiguous parameters MUST use one options object

A new or changed function or constructor MUST take a single options object instead of positional parameters when it has any of:

- 3 or more parameters
- an optional parameter that callers would skip with `undefined`
- 2 or more parameters of the same type that could be swapped without a type error (for example `tmsLinks` and `tags`)

Keep 1–2 obvious parameters positional.

Declare an `XxxOptions` type, take `options: XxxOptions` and destructure it on the first line. In a constructor, declare the fields and assign each one explicitly rather than `Object.assign(this, options)`, so strict checks still cover every field. Callers pass only the fields they need. Keep `""` where it is a real value: it is not the same as omitting the field.

The positional `Currency` and `Transaction` constructors in `live-e2e-shared` predate this rule. Callers keep using them as they are until they are migrated.

## Page objects

### Selectors MUST live on the page object that renders the screen

Specs MUST NOT repeat selector or test-id string literals.

### Selectors MUST be non-public and readonly

Selectors MUST be `private readonly`. A selector that is part of a subclass contract MUST be `protected readonly`. A selector MUST NOT be public.

### Page objects MUST own atomic UI actions

A spec MUST describe only the scenario.

### A page object MUST keep one assertion-method prefix

The prefix MUST be one of `expect*`, `check*`, or `verify*`, and that page object MUST keep it. A new page object MUST use `expect*`. In a page object that already mixes prefixes, a new method MUST take the prefix most of its methods use, and existing methods MUST NOT be renamed only to align them.

### Cross-page workflows MUST live in a util, builder, or flow

Reusable scenario orchestration across independent pages MUST live in a util, builder, or flow module. A cohesive action MAY remain on the page object that owns its input and delegate to a composed destination page.

## Tests

### Every test MUST include a TMS annotation

Every test MUST include a TMS annotation with a valid `B2CQA-XXXX` id. See [Desktop](../desktop/docs/e2e-desktop-conventions.md#every-test-must-include-a-tms-annotation) and [Mobile](../mobile/docs/e2e-mobile-conventions.md#the-test-function-must-call-tmslink) for how each client attaches it.

### Tests MUST declare their place in the Allure tree

Desktop and mobile reports share one tree: Team › Folder › test, and Team › Send folder › Scenario › test for New Send Flow sends. Teams on this tree: Coin-integration and BST. Other teams keep a team-only owner until they move, and then join this list.

- Every test MUST declare its team. A test whose team is on the tree MUST also declare its folder, and its scenario for a New Send Flow send.
- A test's team MUST be looked up before asking the user, who is asked only when nothing below gives one [`Team`](../../libs/live-e2e-shared/src/enum/Team.ts) value:
  1. A test of what a coin module provides (its accounts, receive, send, staking) about one currency MUST use `coinTeamOwner(currency.id)` ([`coinTeamOwner.ts`](../../libs/live-e2e-shared/src/data/coinTeamOwner.ts)), which follows CODEOWNERS: BST 1, 2 and 3 coins go to BST, the rest to Coin-integration.
  2. Any other test, one spanning several currencies included, takes the owner its spec file, or other specs of the same feature, already declare.
  3. Otherwise, it takes the CODEOWNERS team of the product code it drives, when that maps to one `Team` value.
- The folder MUST be a `TestFolder` value from [`TestFolder.ts`](../../libs/live-e2e-shared/src/enum/TestFolder.ts), not a string. Adding a token account is `SUBACCOUNTS`, not `ACCOUNTS`.
- A New Send Flow send MUST take its folder from `sendFolder(accountToDebit)` and MUST add a `SendScenario`. A send through the legacy flow MUST use `LEGACY_TESTS`. Other folders, `LEGACY_TESTS` included, MUST NOT take a scenario.
- A new folder or scenario MUST be added to those enums, so both apps show it under the same name.
- A title MUST read `` `[${currency.testLabel}] - Action - qualifier` ``, or `Action - qualifier` for a test not about one currency, and MUST be unique within its folder or scenario, since the tree shows nothing else there.

See [Desktop](../desktop/docs/e2e-desktop-conventions.md#every-describe-must-declare-its-team) and [Mobile](../mobile/docs/e2e-mobile-conventions.md#the-test-function-must-call-tmslink) for how each client declares them.

### Tests MUST NOT hide an interaction failure

Tests MUST NOT add retry loops, manual polling, or a second tap to hide an interaction failure. An incorrect wait MUST be fixed. Otherwise the underlying product, environment, build, or test-flow issue MUST be diagnosed.

### Tests MUST declare what they broadcast from or what state they change

A test MUST declare the QAA account it broadcasts from, with the app or with a CLI command such as a token approval. It MUST also declare shared state it changes, such as the Pay card. No test on another worker or CI machine then uses them at the same time.

It MUST declare the debited account, e.g. `accountToDebit` or `delegation.account`, not the credited one. A token account locks its parent, since both spend from the same address. A test that always disables app broadcast declares no app account.

See [Desktop](../desktop/docs/e2e-desktop-conventions.md#tests-that-broadcast-or-change-shared-state-must-lock-with-exclusivelockfor) and [Mobile](../mobile/docs/e2e-mobile-conventions.md#tests-that-broadcast-or-change-shared-state-must-declare-it-before-their-describe) for how each client declares them, and [Exclusive lock](exclusive-lock.md) for how the lock works and how to read its logs.

### Paytab specs MUST live under paytab

Paytab specs MUST live under the `paytab` directory so they automatically opt in to an injected Card session. Injection differs by client. See [Desktop](../desktop/README.md#pay-tab) and [Mobile](../mobile/README.md#pay-tab).
