import React, { PropsWithChildren } from "react";
import { Flex } from "@ledgerhq/react-ui";

const SeedStepWrapper = ({ children, testId }: PropsWithChildren & { testId: string }) => {
  return (
    <Flex flexDirection="column" data-testid={testId}>
      {children}
    </Flex>
  );
};

export default SeedStepWrapper;
