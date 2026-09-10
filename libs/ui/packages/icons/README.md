# `@ledgerhq/icons-ui`

> [!WARNING]
> **Status: DEPRECATED** — Deprecated. Icons are now provided by `@ledgerhq/lumen-ui-react` and `@ledgerhq/lumen-ui-rnative`.

[![npm](https://img.shields.io/npm/v/@ledgerhq/icons-ui)](https://www.npmjs.com/package/@ledgerhq/icons-ui)

### A collection of Ledger-flavoured icons

#### This internal package contains a collection of React and React Native icon components.

## Usage

### Props

```ts
declare type Props = {
  /**
   *  Icon size, defaults to 16.
   */
  size?: number | string;
  /**
   * Icon color, defaults to currentColor.
   */
  color?: string;
};
```

### React

```js
import { Airplane, LedgerLogo } from "@ledgerhq/icons-ui/react"

/* … */

<Airplane color="green" />
<LedgerLogo size="XL" color="black" />
```

### React Native

```js
import { Airplane, LedgerLogo } from "@ledgerhq/icons-ui/native"

/* … */

<Airplane color="green" />
<LedgerLogo size="XL" color="black" />
```
