# @shared/address-validation

> [!CAUTION] > **Status: UNSTABLE** — Presentation primitives are being introduced for address-validation feedback.

Reusable, business-agnostic presentation primitives for address-validation feedback shared by multiple applications.

## Public API

- `SanctionedAddressBanner` renders an error banner with an optional title and an injected action.

Consumers provide translated copy and handle navigation themselves, so this package has no routing, URL, localization, or validation-rule dependency.
