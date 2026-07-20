---
"@domain/api-pay-card": patch
"@domain/entity-pay-card": major
"@features/flow-card": minor
---

Added CardLogin component for handling user authentication.

- Added a Pay Card slice handoff so mobile can open the Pay Card Web3Hub manifest after `/pre-auth`; the slice now stores only the current `loginUrl` trigger.
- Added the `usePayCard` hook as the feature entrypoint for dispatching hosted login URLs.
- Updated CardScreen to utilize CardLogin for user authentication.
- Enhanced error handling and loading states in the login process.
- Created tests for CardLogin component and its functionality.
