---
"live-mobile": patch
---

Remove three unused mobile dependencies: `react-native-udp`, which had no imports and was unreachable because `dgram` is disabled in the bundler config yet was still autolinked into both binaries, plus the obsolete `jetifier` and `react-native-debugger-open` dev dependencies and the `DEBUG_RNDEBUGGER` postinstall hook that invoked the latter.
