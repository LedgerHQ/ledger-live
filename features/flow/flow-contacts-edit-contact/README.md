# @features/flow-contacts-edit-contact

> [!CAUTION]
>
> **Status: UNSTABLE** — In active development as part of the Contacts feature.

Shared Edit contact journey for Desktop and Mobile.

## Scope

This package owns contact-name edit state and the Web dialog / Native drawer views. It uses the
contact-name validation contract from `@domain/entity-contact` and receives the contact-edit port
as an explicit dependency so it can be mounted independently.

## Public API

Import `@features/flow-contacts-edit-contact` from both platforms. The package entry point
resolves the Web dialog or Native drawer from the consumer's platform configuration.

`@features/platform-contacts` owns the shared contact-edit port implementation and contact-name
input primitives. This leaf owns its Native drawer content. Applications own their container
placement, navigation, translations, and analytics.
