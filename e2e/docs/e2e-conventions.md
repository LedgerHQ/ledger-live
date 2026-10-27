# Shared E2E conventions

Rules for desktop and mobile E2E tests. MUST and MUST NOT are required. SHOULD is the default, and the same section states any exception.

## Test state

### Setup MUST be deterministic

Tests MUST seed dismissed introductions, onboarding, and settings through fixtures and feature flags. Tests MUST NOT branch the flow on whether something is visible.

### Feature Flags

Set `E2E_FEATURE_FLAGS_JSON` to inject feature flags for a Desktop or Mobile run. The value MUST be a JSON object of flag keys. An empty value is ignored. Arrays, scalars, `null`, and invalid JSON MUST be rejected.

```json
{
  "myFeature": {
    "enabled": true,
    "params": {
      "foo": "bar"
    }
  }
}
```

```bash
export E2E_FEATURE_FLAGS_JSON='{"myFeature":{"enabled":true,"params":{"foo":"bar"}}}'
```

Feature Flags apply in this order. A later layer replaces the same key:

1. Built-in E2E defaults.
2. The preset from `E2E_DESKTOP_FEATURE_FLAGS` or `E2E_MOBILE_FEATURE_FLAGS` (if set).
3. `E2E_FEATURE_FLAGS_JSON`.
4. Per-test flag (set in the spec or at test initialization).

See [Desktop Feature Flag Presets](../desktop/README.md#feature-flag-presets) and [Mobile Feature Flag Presets](../mobile/README.md#feature-flag-presets) for available options.

## Shared support

### Shared fixtures and helpers MUST live in libs/live-e2e-shared

Shared data, types, and utility functions MUST be declared in `libs/live-e2e-shared` when both desktop and mobile use them. Client-specific logic MUST stay in the desktop or mobile directory.

## Page objects

### Selectors MUST live on the page object that renders the screen

Specs MUST NOT repeat selector or test-id string literals.

### Selectors MUST be non-public and readonly

Selectors MUST be `private readonly`. A selector that is part of a subclass contract MUST be `protected readonly`. A selector MUST NOT be public.

### Page objects MUST own atomic UI actions

A spec MUST describe only the scenario.

### A page object MUST keep one assertion-method prefix

The prefix MUST be one of `expect*`, `check*`, or `verify*`, and that page object MUST keep it.

### Cross-page workflows MUST live in a util, builder, or flow

Reusable scenario orchestration across independent pages MUST live in a util, builder, or flow module. A cohesive action MAY remain on the page object that owns its input and delegate to a composed destination page.

## Tests

### Every test MUST include a TMS annotation

Every test MUST include a TMS annotation with a valid `B2CQA-XXXX` id. See [Desktop](../desktop/docs/e2e-desktop-conventions.md#every-test-must-include-a-tms-annotation) and [Mobile](../mobile/docs/e2e-mobile-conventions.md#the-test-function-must-call-tmslink) for how each client attaches it.

### Tests MUST NOT hide an interaction failure

Tests MUST NOT add retry loops, manual polling, or a second tap to hide an interaction failure. An incorrect wait MUST be fixed. Otherwise the underlying product, environment, build, or test-flow issue MUST be diagnosed.

### Tests MUST declare what they broadcast from or change

A test MUST declare the QAA account it broadcasts from, with the app or with a CLI command such as a token approval. It MUST also declare shared state it changes, such as the Pay card. No test on another worker or CI machine then uses them at the same time.

It MUST declare the debited account, e.g. `accountToDebit` or `delegation.account`, not the credited one. A token account locks its parent, since both spend from the same address. A test that always disables app broadcast declares no app account.

See [Desktop](../desktop/docs/e2e-desktop-conventions.md#exclusive-lock-implementation) and [Mobile](../mobile/docs/e2e-mobile-conventions.md#exclusive-lock-implementation) for how each client declares them, and [Exclusive lock](exclusive-lock.md) for how the lock works and how to read its logs.

### Paytab specs MUST live under paytab

Paytab specs MUST live under the `paytab` directory so they automatically opt in to an injected Card session. Injection differs by client. See [Desktop](../desktop/README.md#pay-tab) and [Mobile](../mobile/README.md#pay-tab).

### Ambiguous parameters MUST use one options object

A function or constructor MUST take a single options object instead of positional parameters when it has any of:

- 3 or more parameters
- an optional parameter that callers would skip with `undefined`
- 2 or more parameters of the same type that could be swapped without a type error (for example `tmsLinks` and `tags`)

Keep 1–2 obvious parameters positional.

Declare an `XxxOptions` type, take `options: XxxOptions` and destructure it on the first line. In a constructor, declare the fields and assign each one explicitly rather than `Object.assign(this, options)`, so strict checks still cover every field. Callers pass only the fields they need. Keep `""` where it is a real value: it is not the same as omitting the field.
