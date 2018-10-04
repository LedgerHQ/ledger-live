## TODO

High:

- Android and iOS: some account would just fail to sync and set 0.00 in balance. I wonder if related to following bug:

Medium:

Low:

- Provide a way to Reset the libcore with a native API calls. it would REMOVE the full sqlite database like on Desktop.
- Provide a way to set the timeout of http calls.
- on JS side, we must protect some code to run in parallel. e.g. getOrCreateWallet. we need a `atomicLibcoreAccess()` function (like our deviceAccess in Desktop). This code needs to be used at the lowest atomic part possible, to not include stuff that do long things like http queries.
  - then, we need to be able to Sync in parallel. The libcore seems to randomly crash (To Be Investigated)
