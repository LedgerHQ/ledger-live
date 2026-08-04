# @features/platform-address-validation

> [!CAUTION]
> **Status: UNSTABLE** — Shared address-validation feedback primitives are being introduced for Send and Contacts.

Reusable, domain-aware presentation primitives for address-validation feedback shared by multiple user flows.

## Public API

- `SanctionedAddressBanner` renders an error banner with an optional title and an injected action.

Consumers provide translated copy and handle navigation themselves, so this package has no app routing, URL, or localization dependency.
