import React from "react";
import { Text, Flex, Logos, Switch } from "@ledgerhq/react-ui";
if (typeof window !== "undefined") require("@ledgerhq/react-ui/assets/fonts");

export default function Home({ isLight, setPalette }) {
  return (
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
  );
}
