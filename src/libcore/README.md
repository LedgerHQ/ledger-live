## TODO

### Run App on iOS Simulator:
If you want to run app on iOS simulator you should remove the Universal framework from `Embedded Binaries` section, replace it (drag and drop) with x86 framework which is already under `Frameworks` folder of `ledgerlivemobile.xcodeproj` (and of course add it under `Link Binary With Libraries` section)

High:

Medium:

- (No strange behaviour, we try and catch from libcore side so exception brakpoints are hit) iOS: If using "Exception Breakpoint", you will see crash inside libcore (createWallet)
- (Not Reproducible) Android crashes with: `Attempt to invoke virtual method 'long java.lang.Long.longValue()' on a null object reference`. To me this appear after the last JS<>core exchange was `CoreOperation.getSenders([{"uid":"f692e53a-3ebc-4c1c-8a9f-ed6b7b8c057d","type":"RCTCoreOperation"},12288,12289])`.

Low:

- Provide a way to Reset the libcore with a native API calls. it would REMOVE the full sqlite database like on Desktop.
- Provide a way to set the timeout of http calls.
- on JS side, we must protect some code to run in parallel. e.g. getOrCreateWallet. we need a `atomicLibcoreAccess()` function (like our deviceAccess in Desktop). This code needs to be used at the lowest atomic part possible, to not include stuff that do long things like http queries.
  - then, we need to be able to Sync in parallel. The libcore seems to randomly crash (To Be Investigated)
