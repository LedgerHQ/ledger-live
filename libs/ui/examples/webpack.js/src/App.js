import React from "react";
import { Text, Flex, Logos, Switch } from "@ledgerhq/react-ui";
import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
  }
`;

export function App({ isLight, setPalette }) {
  return (
    <>
      <GlobalStyle />
      <Flex
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        rowGap={12}
        style={{ height: "100vh" }}
        backgroundColor="neutral.c00"
      >
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
    </>
  );
}
