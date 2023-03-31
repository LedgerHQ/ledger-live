import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Button, Divider, Flex, Switch, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";

import { useSetNavigationHeader } from "../../../../hooks/useSetNavigationHeader";
import { ScreenName } from "../../../../const";
import { StackNavigatorNavigation } from "../../../../components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "../../../../components/RootNavigator/types/SettingsNavigator";
import TextInput from "../../../../components/TextInput";
import HeaderLeftBack from "../../../../components/HeaderLeftBack";
import HeaderRightClose from "../../../../components/HeaderRightClose";

export default function DebugSetHeader() {
  const navigation =
    useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();
  const { colors } = useTheme();

  const [title, setTitle] = useState("default title");
  const [isLeftBackArrowDisplayed, setIsLeftBackArrowDisplayed] =
    useState(false);
  const [isRightCloseDisplayed, setIsRightCloseDisplayed] = useState(false);

  useSetNavigationHeader({
    headerShown: true,
    title,
    headerLeft: isLeftBackArrowDisplayed ? () => <HeaderLeftBack /> : null,
    headerRight: isRightCloseDisplayed
      ? () => (
          <HeaderRightClose color={colors.neutral.c100} preferDismiss={true} />
        )
      : null,
  });

  return (
    <Flex flex={1} p={15}>
      <Flex mb="2">
        <Switch
          checked={isLeftBackArrowDisplayed}
          onChange={val => setIsLeftBackArrowDisplayed(val)}
          label={"Display back arrow on the left"}
        />
      </Flex>
      <Flex mb="2">
        <Switch
          checked={isRightCloseDisplayed}
          onChange={val => setIsRightCloseDisplayed(val)}
          label={"Display close button on the right"}
        />
      </Flex>
      <Flex mt="4" mb={4}>
        <TextInput
          value={title}
          maxLength={100}
          onChangeText={setTitle}
          placeholder={"Header title"}
        />
      </Flex>
      <Divider />
      <Flex mt={4}>
        <Text>
          Navigating to SetHeaderBis and coming back should NOT clean the
          updates on the header of SetHeader
        </Text>
        <Button
          type="main"
          onPress={() => navigation.navigate(ScreenName.DebugSetHeaderBis)}
          mt={3}
          size="small"
          outline
        >
          Navigate to SetHeaderBis debug screen 👉
        </Button>
      </Flex>
    </Flex>
  );
}
