import React from "react";
import { Flex } from "@ledgerhq/react-ui";

type Props = {
  children: React.ReactNode;
  footer?: React.ReactNode;
};

const StepContainer: React.FC<Props> = props => {
  const { footer, children } = props;
  return (
    <Flex flexDirection="column" justifyContent="space-between" flex={1}>
      <Flex flex={1} flexDirection="column" justifyContent="center" alignItems="stretch">
        {children}
      </Flex>
      {footer}
    </Flex>
  );
};

export default StepContainer;
