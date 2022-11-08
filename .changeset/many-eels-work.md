---
"@ledgerhq/react-native-hid": minor
---

Bump target and compile sdk versions to mark PendingIntents with PendingIntent.FLAG_MUTABLE. Starting with Build.VERSION_CODES.S, it is required to explicitly specify the mutability of PendingIntents on creation with either FLAG_IMMUTABLE or FLAG_MUTABLE.
