---
"live-mobile": minor
---

Lock the app only after it has been away for 15 seconds.

The gate used to lock the moment the app left. It now notes when the app leaves and decides when it comes back: away for 15 seconds or more, the app locks; back sooner, it opens where the user left it. The lock on launch is unchanged, so an app the system ended while away still asks on the way back.

While the app is away, protected content is covered, so the app switcher and the moment of return show a cover rather than the wallet. Under Detox the grace is one second, so e2e specs do not wait out the real one. On Android the return comes from the process lifecycle, like the departure, through a new `appDidEnterForeground` event on `AppVisibilityModule`; on iOS it is `AppState` turning active.
