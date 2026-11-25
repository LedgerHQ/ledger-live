---
"@ledgerhq/live-dmk-speculos": minor
"@ledgerhq/live-dmk-mobile": minor
"live-mobile": minor
---

`AppDmkSpeculosTransport` reaches Speculos through the DMK of the app for `withDevice` and reuses the session a Device Intent opened, instead of connecting a second DMK session in the middle of the flow. Mobile e2e uses it, and the mobile app DMK normalizes the Speculos OS version
