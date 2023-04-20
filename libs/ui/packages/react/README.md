# `@ledgerhq/react-ui`

[![npm](https://img.shields.io/npm/v/@ledgerhq/react-ui)](https://www.npmjs.com/package/@ledgerhq/react-ui)
[![storybook](https://img.shields.io/badge/Storybook-📚-61DBFB)](https://react-ui-storybook.vercel.app)

### Design and interface resources for React

#### This package contains [React](https://reactjs.org/) components and styles built on top of our design system and used internally at [Ledger](https://www.ledger.com/).

## Reference

**[🔗 Storybook](https://react-ui-storybook.vercel.app)**

## Installation

### Package

```sh
npm i @ledgerhq/react-ui
```

### Peer dependencies

This library uses [styled components](https://styled-components.com/) heavily and relies on it being installed separately (to avoid package duplication).

```sh
npm i styled-components
```

And (obviously) if React packages are not already installed:

```sh
npm i react react-dom
```

## Usage

**ℹ️ Minimal working examples for ***Next.js*** and ***React.js*** can be found in the root of the UI package.**

### Provider

Before using the library components, the style provider must be imported and rendered once to provide the components with the right context.

```tsx
import { StyleProvider } from "@ledgerhq/react-ui";

function Root({ children }) {
  // Selected theme palette can be either "dark" or "light".
  return <StyleProvider selectedPalette="light">{children}</StyleProvider>;
}
```

### Components

Import the components from `@ledgerhq/react-ui`.

```tsx
import { Text, Flex, Logos } from "@ledgerhq/react-ui";

function Hello() {
  return (
    <Flex flexDirection="column" alignItems="center" rowGap={12} p={12}>
      <Text color="neutral.c100">
        <Logos.LedgerLiveRegular />
      </Text>
      <Text variant="h1">Hello, world!</Text>
    </Flex>
  );
}
```

### Fonts (optional but recommended)

Ledger fonts can be either imported or added manually to your project.

>⚠️ Importing the fonts relies on Styled Components global providers.
Each re-render of the global provider (IE when changing the theme) will result in an update of the global styles, thus forcing the browser to refresh fonts.
To avoid this issue, it is recommended to use the [manual approach](#manual-approach).
If you still prefer the automatic approach, make sure to limit any state change and rerender within the global style provider

#### Automatic Approach

After picking a method add the `fontsPath` property to the `StyleProvider` component to automatically generate
`@font-face` blocks and register the `Inter` and `Alpha` font families.

```tsx
// Create a global css font style that will import the required fonts based on the fontsPath prefix.
<StyleProvider fontsPath="assets/fonts">
```

##### Import

Using the import requires you to use a bundler to export and save the files to the target folder.

```js
import "@ledgerhq/react-ui/assets/fonts";
```

With webpack 5 the rule below will process the font files and save them in the `src/assets/fonts` folder.

```js
{
  test: /\.woff2/,
  type: "asset/resource",
  generator: {
    filename: "assets/fonts/[name].woff2",
  },
},
```

##### Scoped Imports

If you are using a loader that saves the fonts with custom names (for instance when using `create-react-app`), you can use the `fontMappings` prop to map the font names.

```js
// These imports return the path to the public folder where the loader saves the fonts during the build.
import HMAlphaMono from "@ledgerhq/react-ui/assets/fonts/HMAlphaMono-Medium.woff2";
import InterBold from "@ledgerhq/react-ui/assets/fonts/Inter-Bold.woff2";
import InterExtraBold from "@ledgerhq/react-ui/assets/fonts/Inter-ExtraBold.woff2";
import InterExtraLight from "@ledgerhq/react-ui/assets/fonts/Inter-ExtraLight-BETA.woff2";
import InterLight from "@ledgerhq/react-ui/assets/fonts/Inter-Light-BETA.woff2";
import InterMedium from "@ledgerhq/react-ui/assets/fonts/Inter-Medium.woff2";
import InterRegular from "@ledgerhq/react-ui/assets/fonts/Inter-Regular.woff2";
import InterSemiBold from "@ledgerhq/react-ui/assets/fonts/Inter-SemiBold.woff2";

// Map the font names with the file path.
const fontMap = {
  "HMAlphaMono-Medium": HMAlphaMono,
  "Inter-Bold": InterBold,
  "Inter-ExtraBold": InterExtraBold,
  "Inter-ExtraLight-BETA": InterExtraLight,
  "Inter-Light-BETA": InterLight,
  "Inter-Medium": InterMedium,
  "Inter-Regular": InterRegular,
  "Inter-SemiBold": InterSemiBold,
};

// The substring call is used to make the path relative (removes the prepending /).
const fontMappings = (name) => fontMap[name].substring(1);

/* … */

<StyleProvider fontPath="path/to/fonts" fontMappings={fontMappings}>
```

#### Manual Approach

The `.woff2` font files are located in the `src/assets/fonts` folder.
You can host them yourself, use a CDN (see below) or process them with a bundler by importing them.

The important thing is to register fonts by adding `@font-face` blocks for the `Inter` and `Alpha` font families.

For instance using the `unpkg.com` CDN:

```css
@font-face {
  font-family: "Alpha";
  src: url("https://unpkg.com/@ledgerhq/react-ui/assets/fonts/HMAlphaMono-Medium.woff2") format("woff2");
  font-weight: 100;
  font-style: normal;
}
```

## Minimal Working Example

[🌍 Hosted here.](https://codesandbox.io/s/ledger-live-react-ui-forked-1tvm7?file=/src/App.js)

_Assuming dependencies, webpack and babel (or equivalents) are installed and configured._

```tsx
import React from "react";
import ReactDOM from "react-dom";
import "@ledgerhq/react-ui/assets/fonts"; // all fonts are consumed by the bundler and outputted to /assets
import { StyleProvider, Text, Logos, Flex, Switch } from "@ledgerhq/react-ui";

function Root() {
  const [palette, setPalette] = React.useState("light");
  const isLight = palette === "light";

  return (
    <StyleProvider fontsPath="assets" selectedPalette={palette}>
      <Flex flexDirection="column" alignItems="center" rowGap={12} p={12}>
        <Text color="neutral.c100">
          <Logos.LedgerLiveRegular />
        </Text>
        <Text variant="h1">Hello, world!</Text>
        <Switch
          name="select-theme"
          checked={isLight}
          onChange={() => setPalette(() => (isLight ? "dark" : "light"))}
        />
      </Flex>
    </StyleProvider>
  );
}

ReactDOM.render(<Root />, document.getElementById("react-root"));
```

<img width="300" alt="exapmple" src="https://user-images.githubusercontent.com/86958797/137143696-6dffdb16-83fa-4a4e-9bd0-a76fde4f82be.gif" />

### Contributing

Check the [contributing guide here](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/ui/packages/react/CONTRIBUTING.md).

#### Adding fonts

To add fonts to ReactUI, you must add your font to the `assets/fonts` folder.

Then the `package.json`of the repository needs to be updated by adding your font path to the export rule. This will ensure that the font is made available for all the consumers (React, node, NextJS...)
```json
    "exports": {
      [...]
      "./assets/fonts/HMAlphaMono-Medium.woff2": "./lib/assets/fonts/HMAlphaMono-Medium.woff2",
      [...]
  },
```

You can than add the path to your font to `assets/fonts.ts` file. That file is then proceded by default as the font path. Make sure to update this document and the minimal working examples for users that install the fonts manually.
