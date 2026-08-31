# @features/flow-contacts-detail

> [!CAUTION]
>
> **Status: UNSTABLE** — In active development; API may change.

Shared Contact Detail journey for Desktop and Mobile.

## Scope

- Contact Detail views and address-detail presentation
- Detail-local state, view models, selection, edit and delete lifecycle
- Contact and address action ports backed by the Contacts entity
- Web dialogs and native drawer content specific to Contact Detail

## Public API

Import reusable Detail views, types, hooks and presentation components from
`@features/flow-contacts-detail`. The root export resolves Web or React Native automatically.

`@features/flow-contacts` remains the aggregate that coordinates Contact Detail with List,
Introduction, Edit contact and Edit address journeys. Applications keep routes, navigation,
translations, analytics adapters and modal/sheet mounting.

## Structure

The package owns one user journey. Its root contains the Detail screen state and view models, while
`components/` contains Detail-specific UI and `ports/` contains app-injected validation boundaries.
Web and Native implementations are colocated with the same concept using `.web` and `.native`
suffixes.
