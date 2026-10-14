---
"live-mobile": patch
---

Load Expo's runtime before react-native-url-polyfill so the polyfill's URLSearchParams (with `size`) stays installed; fixes Aptos sends to an unfunded account failing with "insufficient funds"
