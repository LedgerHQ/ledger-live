import React, { ReactNode, useCallback, useState } from "react";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/core";
import { useDispatch } from "react-redux";
import styled from "styled-components/native";
import { setHasOrderedNano, setOnboardingHasDevice } from "~/actions/settings";
import { ScreenName } from "~/const";
import QueuedDrawer from "~/components/QueuedDrawer";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { TrackScreen, track, updateIdentify } from "~/analytics";
import Illustration from "~/images/illustration/Illustration";
import { useRebornFlow } from "LLM/features/Reborn/hooks/useRebornFlow";
import ImageLedger from "~/images/double-ledger.png";

type Props = {
  onClose: () => void;
  isOpen: boolean;
};

type NavigationProps = StackNavigatorProps<
  OnboardingNavigatorParamList,
  ScreenName.OnboardingPostWelcomeSelection
>;
export function NoLedgerYetModal({ onClose, isOpen }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProps["navigation"]>();

  const [isFromBuy, setFromBuy] = useState(false);
  const { navigateToRebornFlow, rebornFeatureFlagEnabled } = useRebornFlow(true);

  const identifyUser = useCallback(
    (hasDevice: boolean) => {
      dispatch(setOnboardingHasDevice(hasDevice));
      updateIdentify();
    },
    [dispatch],
  );

  const onCloseAndTrack = useCallback(() => {
    onClose();

    track("button_clicked", {
      button: "Close",
      page: "Onboarding Get Started",
      drawer: "Get Started Upsell",
    });
  }, [onClose]);

  const exploreLedger = useCallback(() => {
    dispatch(setHasOrderedNano(false));
    navigation.navigate(ScreenName.OnboardingModalDiscoverLive);
    identifyUser(false);
    track("button_clicked", {
      button: "Explore the app",
      page: "Onboarding Get Started",
      drawer: "Get Started Upsell",
    });
  }, [dispatch, navigation, identifyUser]);

  const buyLedger = useCallback(() => {
    setFromBuy(true);
    track("button_clicked", {
      button: "Buy a Ledger",
      page: "Onboarding Get Started",
      drawer: "Get Started Upsell",
    });
    navigateToRebornFlow();
  }, [navigateToRebornFlow]);

  return (
    <QueuedDrawer
      isRequestingToBeOpened={!!isOpen}
      onClose={isFromBuy ? onClose : onCloseAndTrack}
      CustomHeader={CustomHeader}
    >
      <TrackScreen category="Onboard" name="Start Upsell" drawer="Get Started Upsell" />
      <Flex alignItems="flex-start" mt={7}>
        <Text variant="h4" fontWeight="semiBold" color="neutral.c100">
          {t("onboarding.postWelcomeStep.noLedgerYetModal.title")}
        </Text>
        <Text variant="bodyLineHeight" fontWeight="medium" color="neutral.c70" mt={6}>
          {t("onboarding.postWelcomeStep.noLedgerYetModal.desc")}
        </Text>
      </Flex>

      {!rebornFeatureFlagEnabled && (
        <Flex mx={16} flexDirection={"row"} mt={8}>
          <Button
            onPress={buyLedger}
            type="main"
            size={"large"}
            flex={1}
            testID="onboarding-noLedgerYetModal-buy"
          >
            {t("onboarding.postWelcomeStep.noLedgerYetModal.buy")}
          </Button>
        </Flex>
      )}
      <Flex mx={16} flexDirection={"row"} mt={24}>
        <Button
          onPress={exploreLedger}
          type={rebornFeatureFlagEnabled ? "main" : "default"}
          flex={1}
          testID="onboarding-noLedgerYetModal-explore"
        >
          <Text
            variant="large"
            fontWeight="semiBold"
            color={rebornFeatureFlagEnabled ? "neutral.c00" : "neutral.c100"}
          >
            {t("onboarding.postWelcomeStep.noLedgerYetModal.explore")}
          </Text>
        </Button>
      </Flex>
    </QueuedDrawer>
  );
}

type HeaderProps = {
  children?: ReactNode;
};

const StyledHeader = styled(Flex)`
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: ${p => p.theme.space[6]}px;
  background-color: ${p => p.theme.colors.primary.c80};
`;

const StyledImageContainer = styled(Flex)`
  transform: rotate(-20deg);
  position: static;
  top: -100px;
  left: -50px;
  align-items: center;
  justify-content: center;
`;

const CustomHeader = ({ children }: HeaderProps) => (
  <StyledHeader height={200}>
    {children}
    <StyledImageContainer>
      <Illustration size={550} lightSource={ImageLedger} darkSource={ImageLedger} />
    </StyledImageContainer>
  </StyledHeader>
);
