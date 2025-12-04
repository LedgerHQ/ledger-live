import React, { useCallback, useEffect } from "react";
import { BackHandler } from "react-native";
import { Flex, Text, SlideIndicator, BoxedIcon, Icons } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute } from "@react-navigation/core";
import { NavigatorName, ScreenName } from "~/const";
import { TrackScreen, track } from "~/analytics";
import Button from "~/components/PreventDoubleClickButton";
import { FUND_WALLET_STEPS_LENGTH } from "./shared/fundWalletDetails";
import {
  RootNavigation,
  RootComposite,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import SafeAreaViewFixed from "~/components/SafeAreaView";

const seedConfiguration = "new_seed";

type NavigationProps = RootComposite<
  StackNavigatorProps<OnboardingNavigatorParamList, ScreenName.OnboardingFundSuccess>
>;

export default function OnboardingFundSuccess() {
  const { t } = useTranslation();
  const route = useRoute<NavigationProps["route"]>();
  const baseNavigation = useNavigation<RootNavigation>();

  const { receiveFlowSuccess, deviceModelId } = route.params;

  const handleExploreWallet = useCallback(() => {
    track("Onboarding - End", { seedConfiguration, deviceModelId, flow: "onboarding" });
    baseNavigation.replace(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
  }, [baseNavigation, deviceModelId]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaViewFixed isFlex>
      <TrackScreen
        category="End of onboarding"
        seedConfiguration={seedConfiguration}
        deviceModelId={deviceModelId}
      />
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
          <BoxedIcon
            backgroundColor="opacityDefault.c10"
            borderColor="transparent"
            variant="circle"
            size={72}
            Icon={<Icons.CheckmarkCircleFill color="success.c70" size="XL" />}
          />
        </Flex>
        <Text
          mt={6}
          fontSize="h1"
          fontFamily="Inter"
          textAlign="center"
          fontWeight="semiBold"
          color="neutral.c100"
          lineHeight="36px"
          style={{ letterSpacing: -1.5 }}
        >
          {t("onboarding.fundSuccess.title")}
        </Text>
        <Text
          style={{ letterSpacing: 0 }}
          mt={3}
          fontSize="body"
          textAlign="center"
          color="neutral.c70"
          lineHeight="20px"
        >
          {receiveFlowSuccess
            ? t("onboarding.fundSuccess.receiveSuccess")
            : t("onboarding.fundSuccess.maybeLater")}
        </Text>
      </Flex>

      <Button
        mx={7}
        mb={8}
        type="main"
        size="large"
        onPress={handleExploreWallet}
        testID="onboarding-leder-explore"
      >
        {t("onboarding.fundSuccess.exploreLedger")}
      </Button>
    </SafeAreaViewFixed>
  );
}
