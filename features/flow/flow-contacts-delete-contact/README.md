# @features/flow-contacts-delete-contact

> [!CAUTION]
>
> **Status: UNSTABLE** — In active development; API may change.

Reusable Contact deletion journey for Desktop and Mobile.

## Scope

- Contact deletion lifecycle, validation and Redux-backed port factory
- Web confirmation dialog and Native confirmation drawer content
- Typed hooks, state and presentation props for app-owned modal mounting

The package does not depend on Contact Detail. It resolves its own copy with `@shared/i18n`.
Applications own analytics, navigation and modal or sheet mounting. Generic confirmation presentation is provided by
`@features/platform-contacts` because it is shared across Contacts journeys.
