import React, { useCallback, useEffect } from "react";
import { Flex, Icons, Text, Box } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Button from "../components/wrappedUi/Button";
import { NavigatorName, ScreenName } from "../const";
import { completeOnboarding, setReadOnlyMode } from "../actions/settings";
import { useDispatch } from "react-redux";
import { Pressable, StyleSheet, View } from "react-native";
import { useNavigationInterceptor } from "./Onboarding/onboardingContext";
import { ModalHeaderCloseButton } from "@ledgerhq/native-ui/components/Layout/Modals/BaseModal";

const StyledSafeAreaView = styled(SafeAreaView)`
  background-color: ${({ theme }) => theme.colors.background.main};
`;

export default function PostBuyDeviceSetupNanoWallScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
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
  }, [navigation]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
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
        <ModalHeaderCloseButton onClose={navigation.goBack}/>
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
