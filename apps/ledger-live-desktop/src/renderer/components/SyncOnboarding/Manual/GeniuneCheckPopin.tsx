import React from "react";
import { Button, Flex, Popin, Text } from "@ledgerhq/react-ui";
import { useTheme } from "styled-components";

export type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const GeniuneCheckPopin = ({ isOpen, onClose }: Props) => {
  return (
    <Popin position="relative" isOpen={isOpen}>
      <Flex
        flexDirection="column"
        alignItems="center"
        justifyContent="space-between"
        height="100%"
        padding="40px"
      >
        <Text variant="h2" fontSize="20px" color="palette.primary.c80">
          Authenticity Check
        </Text>
        <Text variant="paragraph" fontSize="25px">
          Let's make sure your Nano is Authentic and safe to use
        </Text>
        <Text variant="paragraph" fontSize="18px" color="palette.neutral.c80">
          We will perform a check to ensure your device hasn't been tampered with. You'll need to
          accept this on your Nano.
        </Text>
        <Button variant="main" width="100%" onClick={onClose}>
          Check device
        </Button>
      </Flex>
    </Popin>
  );
};

export default GeniuneCheckPopin;
