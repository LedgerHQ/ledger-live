---
"live-mobile": patch
---

New BLE pairing flow

Not yet used in production. Accessible from the debug menu.

Features:

- scanning and pairing: one screen to go to from anywhere
- navigate to after pairing success: configuration of the screen (and its associated navigator) with params and name of the route param that will have newly paired device info
- scanning: filtering on device models
- scanning: filtering out or displaying already known devices
- pairing: new animation for pairing (lotties placeholders for now)
- pairing: possibility to add (or not) the newly paired device to the "known devices" of the app (redux store)
