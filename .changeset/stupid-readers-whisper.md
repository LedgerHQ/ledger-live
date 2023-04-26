---
"live-mobile": patch
---

Patch `asyncstorage-down` to import AsyncStorage from `@react-native-async-storage/async-storage`

Ledger Live Mobile has been recently updated to 0.71. One side effect is that `AsyncStorage` was removed from the main `react-native` package and moved to `@react-native-async-storage/async-storage`.

LLM relies on an `fs` polyfill using `asyncstorage-down` under the hood, but the latter is now broken because it contains one hardcoded require call:

```js
require('react-native').AsyncStorage
```

Patching `asyncstorage-down` to import `AsyncStorage` from the right package should solve the issue.
