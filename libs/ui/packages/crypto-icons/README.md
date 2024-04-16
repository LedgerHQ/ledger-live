# `@ledgerhq/crypto-icons-ui`

[![npm](https://img.shields.io/npm/v/@ledgerhq/crypto-icons-ui)](https://www.npmjs.com/package/@ledgerhq/crypto-icons-ui)

### A collection of cryptocurrency icons

#### This package contains a collection of React and React Native cryptocurrency icon components.

## Reference

[**🔗 Icons list**](https://react-ui-storybook.vercel.app/?path=/story/asorted-cryptoicons--list-crypto-icons)

## Installation

**Note:** Do not install this package directly if your project is using `@ledgerhq/react-ui` or `@ledgerhq/native-ui`. Both packages include `icons-ui` as a dependency and the icon components are re-exported and are accessible from there.

### Package

```sh
npm i @ledgerhq/crypto-icons-ui
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
import { BTC, ETH } from "@ledgerhq/crypto-icons-ui/react"

/* … */

<BTC color="green" />
<ETH size={20} color="red" />
```

### React Native

```js
import { BTC, ETH } from "@ledgerhq/crypto-icons-ui/native"

/* … */

<BTC color="green" />
<ETH size={20} color="red" />
```
