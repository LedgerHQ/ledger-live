/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import Illustration from "~/images/illustration/Illustration";

interface EmptyStateProps {
  illustrationSource: {
    light: any;
    dark: any;
  };
  title: string;
  description: string | React.ReactNode;
  buttonText?: string;
  onButtonClick?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  illustrationSource,
  title,
  description,
  buttonText,
  onButtonClick,
}) => {
  return (
    <Flex flex={1} flexDirection="column" alignItems="stretch" p="4" mt={70}>
      <Flex alignItems="center">
        <Illustration
          size={164}
          lightSource={illustrationSource.light}
          darkSource={illustrationSource.dark}
        />
      </Flex>
      <Text textAlign="center" variant="h4" my={3}>
        {title}
      </Text>
      <Text textAlign="center" variant="body" color="neutral.c70">
        {description}
      </Text>
      {buttonText && onButtonClick ? (
        <Button mt={8} onPress={onButtonClick} type="main">
          {buttonText}
        </Button>
      ) : null}
    </Flex>
  );
};

export default EmptyState;
