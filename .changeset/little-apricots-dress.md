---
"live-mobile": patch
---

feat: Android native module for location services

Location services are needed when BLE scanning.
This Android Native module provides:

- a method to check and enable if necessary the location service
- a method to listen to the state (enabled/disabled) of the location service

Also new hook useAndroidEnableLocation using this native module to simplify enabling location services
