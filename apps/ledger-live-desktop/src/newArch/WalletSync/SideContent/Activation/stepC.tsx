import React from "react";
import { Text, Flex } from "@ledgerhq/react-ui";
import ButtonV3 from "~/renderer/components/ButtonV3";

type Props = {
  goNext: () => void;
};

export function StepThree({ goNext }: Props) {
  return (
    <Flex flexDirection={"column"}>
      <Text>{"Step Three"}</Text>
      <ButtonV3 variant="main" onClick={goNext}>
        {"What's next?"}
      </ButtonV3>
    </Flex>
  );
}
