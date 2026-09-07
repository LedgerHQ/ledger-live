# @features/flow-contacts-edit-address

> [!CAUTION]
>
> **Status: UNSTABLE** — In active development as part of the Contacts feature.

Shared Edit address journey for Desktop and Mobile.

## Scope

This package owns address-label and address-entry edit state, together with the Web dialog and
Native drawer views. It uses shared address-entry validation primitives and receives the
address-edit port as an explicit dependency, so it can be mounted independently.

## Public API

Import `@features/flow-contacts-edit-address` from both platforms. The package entry point
resolves the Web dialog or Native drawer from the consumer's platform configuration.

`@features/platform-contacts` owns shared address-entry primitives and the address-edit port.
Applications own their container placement, navigation, translations, and analytics.
