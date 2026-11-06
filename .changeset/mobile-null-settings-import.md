---
"live-mobile": minor
---

fix(settings): ignore empty stored settings on import (LIVE-39321)

On a fresh install no settings are stored, so `getSettings` returns `null` (AsyncStorage) or `undefined` (MMKV). The `SETTINGS_IMPORT` reducer now treats that as an empty import instead of throwing `Cannot convert null value to object` during startup.
