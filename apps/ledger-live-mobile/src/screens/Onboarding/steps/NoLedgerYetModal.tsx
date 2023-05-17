import React, { useCallback } from "react";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/core";
import { useDispatch } from "react-redux";
import { setHasOrderedNano } from "../../../actions/settings";
import { NavigatorName, ScreenName } from "../../../const";
import QueuedDrawer from "../../../components/QueuedDrawer";
import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "../../../components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "../../../components/RootNavigator/types/OnboardingNavigator";
import { BaseNavigatorStackParamList } from "../../../components/RootNavigator/types/BaseNavigator";

type Props = {
  onClose: () => void;
  isOpen: boolean;
};

type NavigationProps = StackNavigatorProps<
  OnboardingNavigatorParamList,
  ScreenName.OnboardingPostWelcomeSelection
>;
export function NoLedgerYetModal({ onClose, isOpen }: Props) {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const exploreLedger = useCallback(() => {
    dispatch(setHasOrderedNano(false));
    navigation.navigate(ScreenName.OnboardingModalDiscoverLive);
  }, [navigation, dispatch]);

  const buyLedger = useCallback(() => {
    (
      navigation as unknown as StackNavigatorNavigation<BaseNavigatorStackParamList>
    ).navigate(NavigatorName.BuyDevice);
  }, [navigation]);

  return (
    <QueuedDrawer isRequestingToBeOpened={!!isOpen} onClose={onClose}>
      <Flex alignItems="center" mt={7}>
        <Text variant="h4" fontWeight="semiBold" color="neutral.c100">
          {t("onboarding.postWelcomeStep.noLedgerYetModal.title")}
        </Text>
        <Text
          variant="bodyLineHeight"
          fontWeight="medium"
          color="neutral.c70"
          mt={6}
        >
          {t("onboarding.postWelcomeStep.noLedgerYetModal.desc")}
        </Text>
      </Flex>
      <Flex mx={16} flexDirection={"row"} mt={8}>
        <Button onPress={buyLedger} type="main" size={"large"} flex={1}>
          {t("onboarding.postWelcomeStep.noLedgerYetModal.buy")}
        </Button>
      </Flex>
      <Flex mx={16} flexDirection={"row"} mt={7}>
        <Button onPress={exploreLedger} type="default" size={"large"} flex={1}>
          {t("onboarding.postWelcomeStep.noLedgerYetModal.explore")}
        </Button>
      </Flex>
    </QueuedDrawer>
  );
}
