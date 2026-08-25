---
"live-mobile": minor
---

Fix Swap: pressing "<" from the History screen after a multi-step swap now returns to the initial input form. Opening a Swap sub-screen no longer replaces the Main navigator when the Swap tab is the focused route (which unmounted the tab navigator and left the back button unable to navigate), and the webview reset is re-applied when the Swap tab regains focus if the live app is still on the page it was asked to leave.
