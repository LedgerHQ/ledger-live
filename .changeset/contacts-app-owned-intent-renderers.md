---
"ledger-live-desktop": minor
"live-mobile": minor
"@features/platform-contacts": minor
---

Move the Contacts device intent renderers into the apps.

`@features/platform-contacts/device/intents` now exports component-less
`IntentDefinition`s. Each app owns its renderers under
`src/mvvm/features/Contacts/deviceIntents/`, composes them into
`IntentPlatformDefinition`s and injects them into `useContactsIntentsOrchestrator`,
which no longer imports a production intent implementation.

A `features/` package cannot resolve translations today, so a renderer that shows
translated copy has to live in the app.
