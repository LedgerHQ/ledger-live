# `@ledgerhq/icons-ui`

[![npm](https://img.shields.io/npm/v/@ledgerhq/icons-ui)](https://www.npmjs.com/package/@ledgerhq/icons-ui)

### A collection of Ledger-flavoured icons

> ⚠️ Do not install this package directly if you are using `@ledgerhq/react-ui` or `@ledgerhq/native-ui`. Both packages include `icons-ui` as a depedency and the icon components are re-exported and are accessible from there.

#### This package contains a collection of React and React Native icon components.

## Reference

[**🔗 Icons list**](https://ledger-live-ui-react.vercel.app/?path=/story/asorted-icons--list)

## Installation

### Package

```sh
npm i @ledgerhq/icons-ui
```

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
import { AppleRegular, ChristmasMedium } from "@ledgerhq/icons-ui/react"

/* … */

<ChristmasMedium color="green" />
<Apple size={20} color="red" />
```

### React Native

```js
import { AppleRegular, ChristmasMedium } from "@ledgerhq/icons-ui/native"

/* … */

<ChristmasMedium color="green" />
<Apple size={20} color="red" />
```
