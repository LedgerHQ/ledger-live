import { Button, Flex } from "@ledgerhq/react-ui";
import React from "react";
import { ActionButtonsProps } from "../types";

export const ActionButtons = ({ primaryAction, secondaryAction }: ActionButtonsProps) => {
  if (!primaryAction && !secondaryAction) {
    return null;
  }

  return (
    <Flex
      position="absolute"
      left={0}
      right={0}
      bottom={0}
      paddingX="24px"
      paddingBottom="40px"
      width="100%"
    >
      <Flex flexDirection="column" width="100%">
        {primaryAction && (
          <Button onClick={primaryAction.onClick} size="large" variant="main" mb="3">
            {primaryAction.text}
          </Button>
        )}
        {secondaryAction && (
          <Button onClick={secondaryAction.onClick} size="large" variant="main" outline>
            {secondaryAction.text}
          </Button>
        )}
      </Flex>
    </Flex>
  );
};
