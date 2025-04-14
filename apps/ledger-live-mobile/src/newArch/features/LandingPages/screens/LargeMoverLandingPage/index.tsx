import { Flex, Text } from "@ledgerhq/native-ui";
import React from "react";

export const LargeMoverLandingPage = () => {
  return (
    <Flex>
      <Flex flexDirection="row" justifyContent="center" alignItems="center">
        <Flex flexDirection="column" justifyContent="center" alignItems="center">
          <Flex>
            <Text>{"Large Mover Landing Page"}</Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};
