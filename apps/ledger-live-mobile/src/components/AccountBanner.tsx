import React, { useCallback } from "react";
import { Alert, Flex, Text } from "@ledgerhq/native-ui";
import Button from "./wrappedUi/Button";
import { track } from "../../analytics";
import { useRoute } from "@react-navigation/native";

type Props = {
  description: string,
  cta: {
    text: string;
    id: string;
  },
  onClick: () => {}
};

export default function AccountBanner({
  description,
  cta,
  onDelegate,
  relegate
}: Props) {
  const route = useRoute();

  const onPress = useCallback(() => {
    track("button_clicked", {
      button: cta.id,
      screen: route.name,
    });
    onDelegate()
  }, []);

  return (
    <>
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
                onPress={onPress}
                size={"small"}
                type={"color"}
                ml={3}
              >
                {cta.text}
              </Button>
          </Flex>
        )}/>
  
 
    </>
  );
}
