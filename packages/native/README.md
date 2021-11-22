# `@ledgerhq/native-ui`

[![build](https://github.com/LedgerHQ/ui/actions/workflows/native.yml/badge.svg)](https://github.com/LedgerHQ/ui/actions/workflows/native.yml)
[![npm](https://img.shields.io/npm/v/@ledgerhq/native-ui)](https://www.npmjs.com/package/@ledgerhq/native-ui)
[![storybook](https://img.shields.io/badge/Storybook-📚-61DBFB)](https://ledger-live-ui-native.vercel.app)

### Design and interface resources for React Native

#### This package contains [React Native](https://reactnative.dev/) components and styles built on top of our design system and used internally at [Ledger](https://www.ledger.com/).

## Reference

**[🔗 Storybook](https://ledger-live-ui-native.vercel.app/)**

## Installation

### Package

```sh
npm i @ledgerhq/native-ui
```

### Peer dependencies

This library uses [styled components](https://styled-components.com/) heavily and relies on it being installed separately (to avoid package duplication).

```sh
npm i styled-components
```

### Required Dependencies

**Skip this step if your project is using Expo! ✨**

```sh
npm i react react-native@^0.64.0 react-native-reanimated@~2.2.3 react-native-svg@^12.1.1
```

Then, follow the installation instructions for:

- [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/docs/2.2.0/installation)
- [react-native-svg](https://github.com/react-native-svg/react-native-svg#installation)

### Recommended Dependencies

```sh
npm i styled-components
```

## Usage

### Provider

Before using the library components, the style provider must be imported and rendered once to provide the components with the right context.

```tsx
import { StyleProvider } from "@ledgerhq/native-ui";

function Root({ children }) {
  // Selected theme palette can be either "dark" or "light".
  return <StyleProvider selectedPalette="light">{children}</StyleProvider>;
}
```

### Components

Import the components from `@ledgerhq/native-ui`.

```tsx
import { Flex, Text } from "@ledgerhq/native-ui";

function Hello() {
  return (
    <Flex flexDirection="column" alignItems="center">
      <Text variant="h1" color="palette.neutral.c100">
        Hello, world!
      </Text>
    </Flex>
  );
}
```

### Fonts

#### Using [Expo](https://expo.dev/)

```sh
expo install expo-font
```

```js
import { useFonts } from "expo-font";

/*
  A higher-order component that will load and provide Ledger fonts to your app.
*/
function FontProvider({ children }) {
  const [fontsLoaded] = useFonts({
    "HMAlphaMono-Medium": require("@ledgerhq/native-ui/assets/fonts/alpha/HMAlphaMono-Medium.otf"),
    "Inter-Medium": require("@ledgerhq/native-ui/assets/fonts/inter/Inter-Medium.otf"),
    "Inter-SemiBold": require("@ledgerhq/native-ui/assets/fonts/inter/Inter-SemiBold.otf"),
    "Inter-Bold": require("@ledgerhq/native-ui/assets/fonts/inter/Inter-Bold.otf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  return children;
}
```

#### React Native - Bare

Add the paths in the `react-native.config.js` file:

```js
module.exports = {
  assets: [
    "node_modules/@ledgerhq/native-ui/assets/fonts/alpha",
    "node_modules/@ledgerhq/native-ui/assets/fonts/inter",
  ],
};
```

Then run the following command to add the required native code:

```
npx react-native link
```

## Minimal Working Example

[🌍 Hosted here.](https://snack.expo.dev/PG3RFRIAP)

### Expo

```js
import React from "react";
import { StyleProvider, Flex, Switch, Text, Logos } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { useFonts } from "expo-font";

function Logo() {
  const theme = useTheme();
  return <Logos.LedgerLiveRegular color={theme.colors.palette.neutral.c100} />;
}

function FontProvider({ children }) {
  const [fontsLoaded] = useFonts({
    "HMAlphaMono-Medium": require("@ledgerhq/native-ui/assets/fonts/alpha/HMAlphaMono-Medium.otf"),
    "Inter-Medium": require("@ledgerhq/native-ui/assets/fonts/inter/Inter-Medium.otf"),
    "Inter-SemiBold": require("@ledgerhq/native-ui/assets/fonts/inter/Inter-SemiBold.otf"),
    "Inter-Bold": require("@ledgerhq/native-ui/assets/fonts/inter/Inter-Bold.otf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  return children;
}

export default function App() {
  const [palette, setPalette] = React.useState("light");
  const isLight = palette === "light";

  return (
    <FontProvider>
      <StyleProvider selectedPalette={palette}>
        <Flex
          flex={1}
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
          backgroundColor="palette.neutral.c00"
        >
          <Logo />
          <Text variant="h2" color="palette.neutral.c100" my={10}>
            Hello, world!
          </Text>
          <Switch
            checked={isLight}
            onChange={() => setPalette(() => (isLight ? "dark" : "light"))}
          />
        </Flex>
      </StyleProvider>
    </FontProvider>
  );
}
```

### React Native - Bare

```js
import React from "react";
import { StyleProvider } from "@ledgerhq/native-ui/styles";
import { Flex, Text, Logos, Switch } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";

function Logo() {
  const theme = useTheme();
  return <Logos.LedgerLiveRegular color={theme.colors.palette.neutral.c100} />;
}

export default function App() {
  const [palette, setPalette] = React.useState("light");
  const isLight = palette === "light";

  return (
    <StyleProvider selectedPalette={palette}>
      <Flex
        flex={1}
        p={12}
        justifyContent="center"
        alignItems="center"
        flexDirection="column"
        backgroundColor="palette.neutral.c00"
      >
        <Logo />
        <Text variant="h2" color="palette.neutral.c100" my={10}>
          Hello, world!
        </Text>
        <Switch
          checked={isLight}
          onChange={() => setPalette(() => (isLight ? "dark" : "light"))}
        />
      </Flex>
    </StyleProvider>
  );
}
```
