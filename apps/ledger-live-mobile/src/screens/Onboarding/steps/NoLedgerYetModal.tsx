import React, { ReactNode, useCallback, useState } from "react";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/core";
import { useDispatch } from "react-redux";
import styled from "styled-components/native";
import { setHasOrderedNano, setOnboardingHasDevice } from "~/actions/settings";
import { NavigatorName, ScreenName } from "~/const";
import QueuedDrawer from "~/components/QueuedDrawer";
import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { TrackScreen, track, updateIdentify } from "~/analytics";
import Illustration from "~/images/illustration/Illustration";

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
  const [isFromBuy, setFromBuy] = useState(false);
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const { t } = useTranslation();
  const dispatch = useDispatch();

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
    (navigation as unknown as StackNavigatorNavigation<BaseNavigatorStackParamList>).navigate(
      NavigatorName.BuyDevice,
    );
  }, [navigation]);

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
      <Flex mx={16} flexDirection={"row"} mt={24}>
        <Button
          onPress={exploreLedger}
          type="default"
          flex={1}
          testID="onboarding-noLedgerYetModal-explore"
        >
          <Text variant="large" fontWeight="semiBold">
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
