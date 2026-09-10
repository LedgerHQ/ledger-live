---
"live-mobile": patch
---

Remove the unused `react-native-udp` dependency, which had no imports left and was still shipping native code into both binaries.
