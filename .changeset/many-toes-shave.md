---
"@ledgerhq/cryptoassets": major
"@ledgerhq/hw-app-btc": major
"@ledgerhq/devices": major
"@ledgerhq/live-common": major
---

Remove the support for imports ending with `/` mapping to the `index.js` file.

For instance:

```js
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/";
```

Should be rewritten to:

```js
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
```

This trailing slash is poorly supported by some tools like `vite.js` and was meant as a transitional change.
Time has come to remove the support for thos shorthand.
