---
"live-mobile": patch
---

A new install of Ledger Wallet Mobile starts on MMKV. When AsyncStorage has no keys and MMKV has no migration status, the app selects MMKV before the first read and sends no `StorageMigration` events. Users with data in AsyncStorage keep the current migration.
