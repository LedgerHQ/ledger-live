High:

- Can't Archive the XCode project of the mobile app.

Medium:

- iOS crashes on a sync, apparently after receiving txs. `RCTCoreLGOperation getBlockHeight`. see mail.

Low:

- Android crashes with: `Attempt to invoke virtual method 'long java.lang.Long.longValue()' on a null object reference`. To me this appear after the last JS<>core exchange was `CoreOperation.getSenders([{"uid":"f692e53a-3ebc-4c1c-8a9f-ed6b7b8c057d","type":"RCTCoreOperation"},12288,12289])`.
- Provide a way to Reset the libcore with a native API calls. it would REMOVE the full sqlite database like on Desktop.
- Provide a way to set the timeout of http calls.
