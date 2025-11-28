import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Flex, Text, SlideIndicator } from "@ledgerhq/native-ui";
import NewSeedIllustration from "../SyncOnboarding/TwoStepStepper/NewSeedIllustration";
import { useTranslation } from "react-i18next";
import { useOpenReceiveDrawer } from "LLM/features/Receive";

import { setIsOnboardingFlow, setIsOnboardingFlowReceiveSuccess } from "~/actions/settings";
import { useNavigation } from "@react-navigation/core";
import { RootNavigation } from "~/components/RootNavigator/types/helpers";
import { isOnboardingFlowReceiveSuccessSelector } from "~/reducers/settings";
import { NavigatorName } from "~/const";
import { track } from "~/analytics";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "~/components/PreventDoubleClickButton";
import { FUND_WALLET_STEPS_LENGTH } from "./shared/fundWalletDetails";

export default function OnboardingSecureYourCrypto() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const baseNavigation = useNavigation<RootNavigation>();
  const [isInitialised, setIsInitialised] = useState<boolean>(false);
  const isOnboardingFlowReceiveSuccess = useSelector(isOnboardingFlowReceiveSuccessSelector);

  const handleReceiveFlowSuccess = useCallback(() => {
    dispatch(setIsOnboardingFlowReceiveSuccess(false));

    baseNavigation.replace(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
  }, [dispatch, baseNavigation]);

  const { handleOpenReceiveDrawer } = useOpenReceiveDrawer({
    sourceScreenName: "sync-onboarding-companion",
    navigationOverride: baseNavigation,
    fromMenu: true,
  });

  const handleSecureCryptoPress = useCallback(() => {
    track("button_clicked", {
      button: "Secure my crypto",
      flow: "onboarding",
    });
    dispatch(setIsOnboardingFlow(true));

    handleOpenReceiveDrawer();
  }, [dispatch, handleOpenReceiveDrawer]);

  const handleMaybeLater = useCallback(() => {
    track("button_clicked", { button: "Maybe later", flow: "onboarding" });
    handleReceiveFlowSuccess();
  }, [handleReceiveFlowSuccess]);

  useEffect(() => {
    if (!isInitialised) {
      if (isOnboardingFlowReceiveSuccess) dispatch(setIsOnboardingFlowReceiveSuccess(false));
      setIsInitialised(true);
    } else if (isOnboardingFlowReceiveSuccess) {
      handleReceiveFlowSuccess();
    }
  }, [isOnboardingFlowReceiveSuccess, handleReceiveFlowSuccess, dispatch, isInitialised]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Flex
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height={48}
      >
        <SlideIndicator
          slidesLength={FUND_WALLET_STEPS_LENGTH}
          activeIndex={9}
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onChange={() => {}}
        />
      </Flex>
      <Flex flexGrow={1} flex={1} mx={6} justifyContent="center" alignItems="center">
        <Flex justifyContent="center" alignItems="center">
          <NewSeedIllustration />
        </Flex>
        <Text
          mt={4}
          fontSize="h1"
          fontFamily="Inter"
          textAlign="center"
          fontWeight="semiBold"
          color="neutral.c100"
          lineHeight="36px"
          style={{ letterSpacing: -1.5 }}
        >
          {t("onboarding.secureYourCrypto.title")}
        </Text>
        <Text
          style={{ letterSpacing: 0 }}
          mt={3}
          fontSize="body"
          textAlign="center"
          color="neutral.c70"
          lineHeight="20px"
        >
          {t("onboarding.secureYourCrypto.subtitle")}
        </Text>
      </Flex>

      <Button
        mx={7}
        type="main"
        size="large"
        onPress={handleSecureCryptoPress}
        testID="onboarding-secure-crypto"
      >
        {t("onboarding.secureYourCrypto.secureCryptoButton")}
      </Button>
      <Button
        mt={2}
        mb={6}
        mx={6}
        size="large"
        onPress={handleMaybeLater}
        testID="maybe-later-secure-crypto"
      >
        {t("onboarding.secureYourCrypto.maybeLater")}
      </Button>
    </SafeAreaView>
  );
}
