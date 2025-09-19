import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import TooltipLabel from "~/components/TooltipLabel";
import NavigationScrollView from "~/components/NavigationScrollView";

export default function TooltipDemo() {
  return (
    <NavigationScrollView>
      <Flex p={6}>
        <Text variant="h3" mb={6}>
          Tooltip demo
        </Text>
        <Flex flexDirection="row" alignItems="center">
          <TooltipLabel label="Tap for info" tooltip="This is a tooltip example for testing." />
        </Flex>
      </Flex>
    </NavigationScrollView>
  );
}
