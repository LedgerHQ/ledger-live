---
"@features/platform-market-countervalues": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Move the countervalues polling loop into a Redux middleware and drop the countervalues React context.

- After changing the countervalue currency, adding an account or tracking a new asset, amounts no longer briefly fall back to the last daily rate before the new rates land.
- On mobile, changing the countervalue currency or adding an account no longer re-renders every amount on screen several times, and loads the rates once instead of up to three times.
- `@features/platform-market-countervalues`: `useCountervaluesState`, `useCountervaluesPolling`, `useCalculate`, `useCalculateCountervalueCallback` and `useSendAmount` keep their names and signatures and read the `countervalues` slice with `useSelector`. The loop moves into `createCountervaluesMiddleware`, started with `startCountervaluesSync({ savedState })`. `CountervaluesProvider`, `CountervaluesBridge`, `Props`, `PollingState` and `useCountervaluesUserSettings` are removed.
- Desktop: the store installs the middleware; boot starts it right before the first render, so the saved rates show from the first frame. The window focus, blur and online events and the saving to disk move into the middleware's configuration.
- Mobile: the store installs the middleware; boot starts it when the app is let through, and a reboot starts it again from the saved state. The extra session tracking pairs move from an RxJS subject into the store.
