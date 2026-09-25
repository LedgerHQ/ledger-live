---
"live-mobile": patch
"@features/flow-pay-card-auth": patch
---

Wait for the app to be active before opening the Card's secure browser, instead of after every biometric prompt.

A Dynamic Island plays Face ID's success animation for about 2.5 seconds after the system has answered, and the app stays inactive throughout. An `ASWebAuthenticationSession` started in that window never appears, and the web browser module then refuses every later session as one already open, so the login button kept spinning until the app was relaunched.

The wait for the app to be active now sits in `openHostedUrlInSecureBrowser`, right before the session starts, and resolves on the app's `active` event, bounded at five seconds against a lost event. A biometric prompt answers straight away again, so the "Face ID enabled" sheet shows while the island is still animating and the wait overlaps the time spent reading it, rather than adding to it. The app's prompt wrapper is removed.
