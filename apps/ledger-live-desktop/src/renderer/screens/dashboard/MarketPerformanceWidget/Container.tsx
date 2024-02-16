import { Flex, Text } from "@ledgerhq/react-ui";
import React from "react";
import Card from "~/renderer/components/Box/Card";

export function MarketPerformanceWidgetContainer() {
  return (
    <Card p={0} py={5} grow>
      <Flex alignItems={"center"} justifyContent={"center"} flex={1}>
        <Text>MarketPerformanceWidgetContainer</Text>
      </Flex>
    </Card>
  );
}
