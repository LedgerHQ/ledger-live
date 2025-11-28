# `@ledgerhq/crypto-icons-ui`

[![npm](https://img.shields.io/npm/v/@ledgerhq/crypto-icons-ui)](https://www.npmjs.com/package/@ledgerhq/crypto-icons-ui)

### A collection of cryptocurrency icons

#### This package contains a collection of React and React Native cryptocurrency icon components.

> ⚠️ **Deprecation Notice**: This package is deprecated and will eventually be replaced by a unified icon approach using `@ledgerhq/icons-ui`. The current implementation is a legacy approach that will be phased out.

## Important Notes

### Icon Size Constraints

These SVG icons are **minimal versions** specifically designed for creating masks. They are transpiled to React components at build time, which is an older approach that will eventually be dropped in favor of the unified `@ledgerhq/icons-ui` system.

**Performance Impact**: These icons are highly sensitive to performance impact. It is **critical** to keep them very small (under 10KB per file). Large icons significantly impact bundle size and application performance, especially on mobile devices.

### Why Size Matters

- These icons are transpiled to React components, meaning each icon adds to the JavaScript bundle size
- They are used extensively throughout the application for currency representations
- Large icons can cause noticeable performance degradation, especially on lower-end devices
- The build process includes all icons in the bundle, so oversized files have a multiplicative effect

**All SVG files in this package must be under 10KB.** This is enforced by automated tests.

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
