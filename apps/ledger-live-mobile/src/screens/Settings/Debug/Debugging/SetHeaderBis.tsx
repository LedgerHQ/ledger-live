import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Button, Divider, Flex, Switch, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { ChevronBottomMedium } from "@ledgerhq/native-ui/assets/icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSetNavigationHeader } from "../../../../hooks/useSetNavigationHeader";
import { ScreenName } from "../../../../const";
import { StackNavigatorNavigation } from "../../../../components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "../../../../components/RootNavigator/types/SettingsNavigator";
import TextInput from "../../../../components/TextInput";
import { NavigationHeaderBackButton } from "../../../../components/NavigationHeaderBackButton";
import { NavigationHeaderCloseButton } from "../../../../components/NavigationHeaderCloseButton";

export default function DebugSetHeaderBis() {
  const navigation =
    useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();
  const { colors } = useTheme();

  const [title, setTitle] = useState("default title");
  const [isLeftBackArrowDisplayed, setIsLeftBackArrowDisplayed] =
    useState(false);
  const [isRightCloseDisplayed, setIsRightCloseDisplayed] = useState(false);
  const [isFullHeaderOverriddenDisplayed, setIsFullHeaderOverriddenDisplayed] =
    useState(false);

  useSetNavigationHeader({
    headerShown: true,
    title,
    headerLeft: isLeftBackArrowDisplayed
      ? () => <NavigationHeaderBackButton />
      : null,
    headerRight: isRightCloseDisplayed
      ? () => <NavigationHeaderCloseButton color={colors.neutral.c100} />
      : null,
    header: isFullHeaderOverriddenDisplayed
      ? () => (
          <>
            <SafeAreaView edges={["top", "left", "right"]}>
              <Flex
                my={5}
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Flex ml={6}>
                  <Button
                    type="main"
                    outline
                    size="small"
                    Icon={ChevronBottomMedium}
                    iconPosition="right"
                    // eslint-disable-next-line @typescript-eslint/no-empty-function
                    onPress={() => {}}
                  >
                    Still Nothing
                  </Button>
                </Flex>
                <NavigationHeaderCloseButtonAdvanced
                  color={colors.neutral.c100}
                  preferDismiss={true}
                />
              </Flex>
            </SafeAreaView>
          </>
        )
      : undefined,
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
      <Flex mb="2">
        <Switch
          checked={isFullHeaderOverriddenDisplayed}
          onChange={val => setIsFullHeaderOverriddenDisplayed(val)}
          label={"Override full header"}
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
          Navigating back to SetHeader and coming back should have cleaned the
          updates on the header of SetHeaderBis 🧼🧹
        </Text>
        <Button
          type="main"
          onPress={() => navigation.navigate(ScreenName.DebugSetHeader)}
          mt={3}
          size="small"
          outline
        >
          Navigate to SetHeader debug screen 👈
        </Button>
      </Flex>
    </Flex>
  );
}
