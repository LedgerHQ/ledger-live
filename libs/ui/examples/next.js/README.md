# Next.js Example

This simple example demonstrates how to use `@ledgerhq/react-ui` with [`next.js`](https://nextjs.org/).
It is based on the default `next.js` template.

To run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```


## Differences with the default `next.js` template

### `package.json`

Add the `@ledgerhq/react-ui` dependency.

```json
 "@ledgerhq/react-ui": "*",
```

### `next.config.js`

Adding styled-components support and configuring the `@ledgerhq/react-ui` fonts.

```js
compiler: {
  // see https://styled-components.com/docs/tooling#babel-plugin for more info on the options.
  styledComponents: { ssr: true },
},
webpack: (
  config,
  { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
) => {
  if (!isServer) {
    config.module.rules.push({
      test: /\.woff2$/i,
      type: "asset/resource",
      generator: {
        filename: "../public/fonts/[name][ext][query]",
      },
    });
  }
  return config;
},
```

### `pages/_document_.js`

Add Server Side Rendering support for styled-components. See: https://github.com/vercel/next.js/tree/canary/examples/with-styled-components

```js
import Document from "next/document";
import { ServerStyleSheet } from "styled-components";

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) =>
            sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);
      return {
        ...initialProps,
        styles: [initialProps.styles, sheet.getStyleElement()],
      };
    } finally {
      sheet.seal();
    }
  }
}
```

### `pages/index.js`

Wrap the app with the `StyleProvider` component and set the `fontsPath` to the `public/fonts` folder.

```js
<StyleProvider selectedPalette={palette} fontsPath="fonts">
```

### `pages/_app.js`

A simple example of using the `@ledgerhq/react-ui` components.

```js
import React from "react";
import { StyleProvider } from "@ledgerhq/react-ui";
import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
  }
`;

export default function App({ Component, pageProps }) {
  const [palette, setPalette] = React.useState("light");
  const isLight = palette === "light";

  return (
    <StyleProvider selectedPalette={palette} fontsPath="fonts">
      <GlobalStyle />
      <Component {...pageProps} isLight={isLight} setPalette={setPalette} />
    </StyleProvider>
  );
}
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
