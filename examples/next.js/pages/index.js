import React from "react";
import { Text, Flex, Logos, Switch } from "@ledgerhq/react-ui";

export default function Home({ isLight, setPalette }) {
  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      rowGap={12}
      p={12}
      style={{ height: "100vh" }}
      backgroundColor="palette.neutral.c00"
    >
      <Text color="palette.neutral.c100">
        <Logos.LedgerLiveRegular />
      </Text>
      <Text variant="h1">Hello, world!</Text>
      <Switch
        name="select-theme"
        checked={isLight}
        onChange={() => setPalette(() => (isLight ? "dark" : "light"))}
      />
    </Flex>
  );
}
