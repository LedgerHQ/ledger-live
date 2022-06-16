import React, { useCallback } from "react";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import { ScreenName } from "../const";

type Props = {
  navigation: any;
  route: {
    params?: {};
  };
};

export default function SelectCrypto({ navigation, route }: Props) {
  const goToNext = useCallback(() => {
    navigation.navigate(ScreenName.ReceiveSelectAccount, {
      ...route.params,
    });
  }, [navigation, route]);

  return (
    <Flex flex={1} color="background.main">
      <Text>Select Crypto</Text>
      <Button onPress={goToNext}>Next</Button>
    </Flex>
  );
}
