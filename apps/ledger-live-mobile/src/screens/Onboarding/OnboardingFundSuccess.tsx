import React, { useCallback } from "react";
import { Flex, Text, IconsLegacy, SlideIndicator, BoxedIcon, Icons } from "@ledgerhq/native-ui";
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

type NavigationProps = RootComposite<
  StackNavigatorProps<OnboardingNavigatorParamList, ScreenName.OnboardingFundSuccess>
>;

export default function OnboardingFundSuccess() {
  const { t } = useTranslation();
  const route = useRoute<NavigationProps["route"]>();
  const baseNavigation = useNavigation<RootNavigation>();

  const { receiveFlowSuccess } = route.params;

  const handleClose = useCallback(() => {
    baseNavigation.replace(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
  }, [baseNavigation]);

  const handleBackButton = useCallback(() => {
    track("button_clicked", {
      button: "Back",
      flow: "onboarding",
    });

    handleClose();
  }, [handleClose]);

  const handleExploreWallet = useCallback(() => {
    track("button_clicked", { button: "Explore Ledger Wallet", flow: "onboarding" });
    handleClose();
  }, [handleClose]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Flex
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        height={48}
      >
        <Button Icon={() => <IconsLegacy.ArrowLeftMedium size={24} />} onPress={handleBackButton} />

        <SlideIndicator
          slidesLength={FUND_WALLET_STEPS_LENGTH}
          activeIndex={9}
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onChange={() => {}}
        />
        <Flex width={48}>{/* <InfoButton target={stepData.drawer} /> */}</Flex>
      </Flex>
      <Flex flexGrow={1} flex={1} mx={6} justifyContent="center" alignItems="center">
        <Flex justifyContent="center" alignItems="center">
          <BoxedIcon
            backgroundColor="opacityDefault.c10"
            borderColor="transparent"
            variant="circle"
            size={60}
            Icon={<Icons.CheckmarkCircleFill color="success.c60" size="L" />}
          />
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
