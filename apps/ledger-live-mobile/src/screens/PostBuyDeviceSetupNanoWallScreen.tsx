import React, { useCallback } from "react";
import { Text, Box } from "@ledgerhq/native-ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet } from "react-native";
import { ModalHeaderCloseButton } from "@ledgerhq/native-ui/components/Layout/Modals/BaseModal/index";
import Button from "../components/wrappedUi/Button";
import { NavigatorName, ScreenName } from "../const";
import { useNavigationInterceptor } from "./Onboarding/onboardingContext";
import { TrackScreen } from "../analytics";
import {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "../components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../components/RootNavigator/types/BaseNavigator";

type NavigationProp = RootNavigationComposite<
  StackNavigatorNavigation<
    BaseNavigatorStackParamList,
    ScreenName.NoDeviceWallScreen
  >
>;

export default function PostBuyDeviceSetupNanoWallScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { setShowWelcome, setFirstTimeOnboarding } = useNavigationInterceptor();

  const setupDevice = useCallback(() => {
    setShowWelcome(false);
    setFirstTimeOnboarding(false);
    navigation.navigate(NavigatorName.BaseOnboarding, {
      screen: NavigatorName.Onboarding,
      params: {
        screen: ScreenName.OnboardingDeviceSelection,
      },
    });
  }, [navigation, setFirstTimeOnboarding, setShowWelcome]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      <TrackScreen
        category="ReadOnly"
        name="Have you Received Device?"
        type="drawer"
      />
      {/* A transparent clickable overlay filling the remaining space on the screen */}
      <Pressable
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0, 0, 0, 0.5)" },
        ]}
        onPress={navigation.goBack}
      />
      <Box
        bg={"background.drawer"}
        width={"100%"}
        borderTopLeftRadius={24}
        borderTopRightRadius={24}
        py={6}
        px={6}
      >
        <ModalHeaderCloseButton onClose={navigation.goBack} />
        <Text textAlign="center" variant="h4" mb={5}>
          {t("postBuyDeviceSetupNanoWall.title")}
        </Text>
        <Text
          textAlign="center"
          variant="bodyLineHeight"
          color={"neutral.c80"}
          mb={8}
        >
          {t("postBuyDeviceSetupNanoWall.desc")}
        </Text>
        <Button
          type="main"
          outline={false}
          event="BuyDeviceScreen - Buy Ledger"
          onPress={setupDevice}
          size="large"
          mb={6}
        >
          {t("postBuyDeviceSetupNanoWall.cta")}
        </Button>
        <Button
          type="shade"
          outline
          event="BuyDeviceScreen - Buy Ledger"
          onPress={navigation.goBack}
          size="large"
        >
          {t("common.close")}
        </Button>
      </Box>
    </SafeAreaView>
  );
}
