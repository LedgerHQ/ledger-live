import React, { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { Flex, Text, SlideIndicator } from "@ledgerhq/native-ui";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/core";
import { useTranslation } from "~/context/Locale";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import NewSeedIllustration from "LLM/features/Onboarding/assets/NewSeedIllustration";
import { setIsOnboardingFlow, setIsOnboardingFlowReceiveSuccess } from "~/actions/settings";
import { isOnboardingFlowReceiveSuccessSelector } from "~/reducers/settings";
import { screen, track } from "~/analytics";
import SafeAreaViewFixed from "~/components/SafeAreaView";
import Button from "~/components/PreventDoubleClickButton";
import { FUND_WALLET_STEPS_LENGTH } from "./shared/fundWalletDetails";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import {
  RootNavigation,
  RootComposite,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";

const seedConfiguration = "new_seed";

type NavigationProps = RootComposite<
  StackNavigatorProps<OnboardingNavigatorParamList, ScreenName.OnboardingSecureYourCrypto>
>;

export default function OnboardingSecureYourCrypto() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProps["navigation"]>();

  const route = useRoute<NavigationProps["route"]>();
  const { deviceModelId } = route.params;

  const baseNavigation = useNavigation<RootNavigation>();

  const [isInitialised, setIsInitialised] = useState<boolean>(false);
  const isOnboardingFlowReceiveSuccess = useSelector(isOnboardingFlowReceiveSuccessSelector);

  const handleReceiveFlowSuccess = useCallback(
    (receiveFlowSuccess: boolean) => {
      dispatch(setIsOnboardingFlowReceiveSuccess(false));

      navigation.navigate(ScreenName.OnboardingFundSuccess, { receiveFlowSuccess, deviceModelId });
    },
    [dispatch, deviceModelId, navigation],
  );

  const { handleOpenReceiveDrawer } = useOpenReceiveDrawer({
    sourceScreenName: "sync-onboarding-companion",
    navigationOverride: baseNavigation,
    fromMenu: true,
  });

  const handleSecureCryptoPress = useCallback(() => {
    track("button_clicked", {
      button: "Secure my crypto",
      flow: "onboarding",
      deviceModelId,
      seedConfiguration,
    });
    dispatch(setIsOnboardingFlow(true));

    handleOpenReceiveDrawer();
  }, [dispatch, handleOpenReceiveDrawer, deviceModelId]);

  const handleMaybeLater = useCallback(() => {
    track("button_clicked", {
      button: "Maybe later",
      flow: "onboarding",
      deviceModelId,
      seedConfiguration,
    });
    handleReceiveFlowSuccess(false);
  }, [handleReceiveFlowSuccess, deviceModelId]);

  useEffect(() => {
    if (!isInitialised) {
      if (isOnboardingFlowReceiveSuccess) dispatch(setIsOnboardingFlowReceiveSuccess(false));
      screen("Set up device: Final Step Your device is ready", undefined, {
        deviceModelId,
        seedConfiguration: "new_seed",
      });
      setIsInitialised(true);
    } else if (isOnboardingFlowReceiveSuccess) {
      handleReceiveFlowSuccess(true);
    }
  }, [
    isOnboardingFlowReceiveSuccess,
    handleReceiveFlowSuccess,
    dispatch,
    isInitialised,
    deviceModelId,
  ]);

  // Need to trigger this second screen tracking call after the first one
  useEffect(() => {
    if (isInitialised) {
      screen("Set up device: Secure your crypto", undefined, {
        deviceModelId,
        seedConfiguration: "new_seed",
      });
    }
  }, [isInitialised, deviceModelId]);

  return (
    <SafeAreaViewFixed isFlex>
      <Flex
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height={48}
      >
        <SlideIndicator slidesLength={FUND_WALLET_STEPS_LENGTH} activeIndex={9} />
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
    </SafeAreaViewFixed>
  );
}
