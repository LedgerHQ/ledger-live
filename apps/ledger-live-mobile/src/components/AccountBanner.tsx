import React, { useCallback } from "react";
import { Alert, Flex, Text } from "@ledgerhq/native-ui";
import Button from "./wrappedUi/Button";
import { useRoute } from "@react-navigation/native";

type Props = {
  description: string;
  cta: {
    text: string;
    id: string;
  };
  onClick: () => {};
};

export default function AccountBanner({
  description,
  cta,
  onPress,
  relegate,
}: Props) {
  const route = useRoute();

  return (
    <Alert
      type="info"
      showIcon={false}
      renderContent={({ color, textProps }) => (
        <Flex flexDirection="row" alignItems="center">
          <Flex flex={1} width={"100%"}>
            <Text
              {...textProps}
              variant="body"
              fontWeight="medium"
              color="neutral.c90"
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
