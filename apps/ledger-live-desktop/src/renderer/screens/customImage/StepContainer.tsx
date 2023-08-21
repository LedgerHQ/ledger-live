import React from "react";
import { Flex } from "@ledgerhq/react-ui";

type Props = {
  children: React.ReactNode;
  footer?: React.ReactNode;
};

const StepContainer: React.FC<Props> = props => {
  const { footer, children } = props;
  return (
    <Flex flex={1} flexDirection="column" justifyContent="space-between" overflowY="hidden">
      <Flex
        flex={1}
        flexDirection="column"
        justifyContent="center"
        alignItems="stretch"
        flexShrink={1}
        overflowY="hidden"
      >
        {children}
      </Flex>
      {footer}
    </Flex>
  );
};

export default StepContainer;
