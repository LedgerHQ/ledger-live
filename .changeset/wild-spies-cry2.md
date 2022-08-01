---
"live-mobile": patch
---

#### Replace [webpack](https://webpack.js.org/) with [vite.js](https://vitejs.dev/) to speed up the ledger live desktop development process.

To fully embrace the "bundleless" vite.js approach, it is necessary to transpile our packages contained in the monorepository to the ESM format, and [subpath exports](https://nodejs.org/api/packages.html#subpath-exports) have been added to silently map to commonjs or esm depending on the need.

#### 🔥 BREAKING CHANGES for `@ledgerhq/live-common`, `@ledgerhq/devices` and `@ledgerhq/hw-app-btc` consumers.

As highlighted [here](https://github.com/nodejs/node#39994), it is not possible to target folders directly when using subpath exports.

The workaround is to suffix the call with `/index` (or `/`).

For instance…

```ts
import * as currencies from "@ledgerhq/live-common/currencies";
```

…must be rewritten to…

```ts
import * as currencies from "@ledgerhq/live-common/currencies/index;";
```

…or:

```ts
import * as currencies from "@ledgerhq/live-common/currencies/;";
```
