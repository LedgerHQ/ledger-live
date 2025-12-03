import React, { useCallback, useEffect } from "react";
import { Flex, Text, SlideIndicator, BoxedIcon, Icons } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";

import { useNavigation, useRoute } from "@react-navigation/core";
import { RootNavigation } from "~/components/RootNavigator/types/helpers";
import { NavigatorName } from "~/const";
import { track } from "~/analytics";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "~/components/PreventDoubleClickButton";
import { FUND_WALLET_STEPS_LENGTH } from "./shared/fundWalletDetails";
import { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { ScreenName } from "~/const";
import { BackHandler } from "react-native";

type NavigationProps = RootComposite<
  StackNavigatorProps<OnboardingNavigatorParamList, ScreenName.OnboardingFundSuccess>
>;

export default function OnboardingFundSuccess() {
  const { t } = useTranslation();
  const route = useRoute<NavigationProps["route"]>();
  const baseNavigation = useNavigation<RootNavigation>();

  const { receiveFlowSuccess } = route.params;

  const handleExploreWallet = useCallback(() => {
    track("button_clicked", { button: "Explore Ledger Wallet", flow: "onboarding" });
    baseNavigation.replace(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
  }, [baseNavigation]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
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
    </SafeAreaView>
  );
}
