---
"@ledgerhq/live-common": major
"@ledgerhq/devices": major
"@ledgerhq/hw-app-btc": major
"@ledgerhq/live-cli": patch
"ledger-live-desktop": patch
"@ledgerhq/hw-app-eth": patch
"@ledgerhq/hw-transport-node-ble": patch
"@ledgerhq/hw-transport-node-hid-noevents": patch
"@ledgerhq/hw-transport-web-ble": patch
"@ledgerhq/hw-transport-webhid": patch
"@ledgerhq/hw-transport-webusb": patch
"@ledgerhq/react-native-hw-transport-ble": patch
"@ledgerhq/icons-ui": patch
"@ledgerhq/react-ui": patch
"has-hash-commit-deps": patch
"@actions/submit-bot-report": patch
"@actions/upload-images": patch
"esbuild-utils": patch
"live-github-bot": patch
"native-modules-tools": patch
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
