---
"@features/platform-contacts": minor
"@features/flow-contacts-add-address": minor
"@features/flow-contacts-add-contact": minor
"@features/flow-contacts-delete-address": minor
"@features/flow-contacts-delete-contact": minor
"@features/flow-contacts-detail": minor
"@features/flow-contacts-edit-address": minor
"@features/flow-contacts-edit-contact": minor
"@features/flow-contacts-list": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Every `@features/platform-contacts` component has one props contract on both platforms. `ContactConfirmationDialog` replaces `ContactConfirmationBottomSheet` on mobile and takes a `tone` (`destructive` or `neutral`), `isConfirming` and `testID`; it reads the sheet's bottom inset itself. `ContactAvatar` takes `testID` instead of `testId` and drops `ariaLabel`, `ContactNameInput` calls `onChangeName`, and `ContactNameDisclaimer` now renders on mobile too. The `.` entry has no `react-native` condition, `./native` is gone, and `./web` exports only `getPastedValue`.
