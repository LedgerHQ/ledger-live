import React from "react";
import { Alert, Flex } from "@ledgerhq/native-ui";
import Button from "./wrappedUi/Button";

type Props = {
  description: string;
  cta: string;
  onPress: () => void;
};

export default function AccountBanner({ description, cta, onPress }: Props) {
  return (
    <Alert type="info" showIcon={false}>
      <Flex flexDirection="row" alignItems="center">
        <Flex flex={1} width={"100%"}>
          <Alert.BodyText>{description}</Alert.BodyText>
        </Flex>
        <Button onPress={() => onPress()} size={"small"} type={"color"} ml={3}>
          {cta}
        </Button>
      </Flex>
    </Alert>
  );
}
