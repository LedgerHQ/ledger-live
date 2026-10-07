---
"live-mobile": minor
"ledger-live-desktop": minor
"@shared/clipboard": minor
"@features/flow-pay-card-transactions": patch
"@features/flow-contacts": patch
---

Route every copy/paste through the new @shared/clipboard package (expo-clipboard replaces @react-native-clipboard/clipboard on mobile) and enforce it with lint rules; copy feedback now only shows once the copy succeeded
