# Shared E2E conventions

This document outlines the shared conventions for writing E2E tests across desktop and mobile clients in this repository.

## State

### Deterministic setup

Seed dismissed introductions, onboarding, and settings through fixtures and feature flags. Do not branch the flow on whether something is visible.

### Feature Flags

Set `E2E_FEATURE_FLAGS_JSON` to inject feature flags for a Desktop or Mobile run. The value is a JSON object of flag keys. An empty value is ignored. Arrays, scalars, `null`, and invalid JSON are rejected.

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

## Shared E2E fixtures and helpers

Shared E2E test support lives in `libs/live-e2e-shared`. Consider declaring shared data, types and utility functions here for reuse across both desktop and mobile E2E tests. Keep client-specific logic in the respective desktop or mobile directories.

## Page objects

### Selectors are stored on the relevant page object

Selectors and test ids live on the page object that renders the screen. Specs do not repeat those string literals.

### Selectors are non-public readonly

Selectors are `private readonly` by default. Use `protected readonly` for subclass contracts; never expose them publicly.

### UI Actions

Atomic UI actions live on the page object for reusability and consistency. A spec only describes the scenario.

### Assertion-method prefix

A page object uses one assertion-method prefix and keeps it (`expect*`, `check*`, or `verify*`).

### Shared cross-page workflows

Reusable scenario orchestration across independent pages lives in a util, builder or flow module. A cohesive action may remain on the page object that owns its input and delegate to a composed destination page.

## TMS annotation for every test

Every test includes a TMS annotation with a valid `B2CQA-XXXX` id. See [Desktop](../desktop/docs/e2e-desktop-conventions.md#tms-annotation) and [Mobile](../mobile/docs/e2e-mobile-conventions.md#tmslink-attaches-the-id) for how each client attaches it.

## Failures

Do not add retry loops, manual polling, or a second tap to hide an interaction failure. Fix an incorrect wait; otherwise diagnose the underlying product, environment, build, or test-flow issue.

## Pay tab

Pay tab specs must live under the `paytab` directory so they automatically opt in to an injected Card session. Injection differs by client. See [Desktop](../desktop/README.md#pay-tab) and [Mobile](../mobile/README.md#pay-tab).

## Named parameters

Use a single options object instead of positional parameters when a function or constructor has any of:

- 3 or more parameters
- an optional parameter that callers would skip with `undefined`
- 2 or more parameters of the same type that could be swapped without a type error (e.g. `tmsLinks` and `tags`)

Keep 1–2 obvious parameters positional.

Declare an `XxxOptions` type, take `options: XxxOptions` and destructure it on the first line. In a constructor, declare the fields and assign each one explicitly rather than `Object.assign(this, options)`, so strict checks still cover every field. Callers pass only the fields they need. Keep `""` where it is a real value: it is not the same as omitting the field.
