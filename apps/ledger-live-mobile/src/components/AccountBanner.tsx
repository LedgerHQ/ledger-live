import React from "react";
import { Alert, Flex, Text } from "@ledgerhq/native-ui";
import Button from "./wrappedUi/Button";

type Props = {
  description: string;
  cta: {
    text: string;
    id: string;
  };
  onPress: () => void;
};

export default function AccountBanner({ description, cta, onPress }: Props) {
  return (
    <Alert
      type="info"
      showIcon={false}
      renderContent={({ textProps }) => (
        <Flex flexDirection="row" alignItems="center">
          <Flex flex={1} width={"100%"}>
            <Text
              {...textProps}
              variant="body"
              fontWeight="medium"
              color="primary.c90"
            >
              {description}
            </Text>
          </Flex>
          <Button
            onPress={() => onPress()}
            size={"small"}
            type={"color"}
            ml={3}
          >
            {cta}
          </Button>
        </Flex>
      )}
    />
  );
}
