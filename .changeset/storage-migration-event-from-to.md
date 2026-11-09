---
"live-mobile": minor
---

The `StorageMigration` analytics event now reports the correct `to` storage: migration events go from AsyncStorage to MMKV, and rollback events go from MMKV to AsyncStorage.
