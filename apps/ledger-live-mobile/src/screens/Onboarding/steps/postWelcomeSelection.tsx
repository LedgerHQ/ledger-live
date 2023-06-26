import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, Flex, Box, Button, Icons } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { useDispatch } from "react-redux";

import { useTheme } from "styled-components/native";
import { TrackScreen, track, updateIdentify } from "../../../analytics";
import { ScreenName } from "../../../const";
import StyledStatusBar from "../../../components/StyledStatusBar";

import { setOnboardingHasDevice, setReadOnlyMode } from "../../../actions/settings";
import { OnboardingNavigatorParamList } from "../../../components/RootNavigator/types/OnboardingNavigator";
import { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";

import { NoLedgerYetModal } from "./NoLedgerYetModal";
import { SelectionCard } from "./SelectionCard";

type NavigationProps = StackNavigatorProps<
  OnboardingNavigatorParamList,
  ScreenName.OnboardingPostWelcomeSelection
>;

function PostWelcomeSelection() {
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const { t } = useTranslation();

  const [isNoLedgerModalOpen, setOpen] = useState(false);

  const identifyUser = useCallback(
    (hasDevice: boolean) => {
      dispatch(setOnboardingHasDevice(hasDevice));
      updateIdentify();
    },
    [dispatch],
  );

  const openModal = useCallback(() => {
    setOpen(true);
    track("button_clicked", {
      button: "I don’t have a Ledger yet",
    });
  }, []);

  const closeModal = useCallback(() => setOpen(false), []);

  const setupLedger = useCallback(() => {
    dispatch(setReadOnlyMode(false));
    identifyUser(true);
    navigation.navigate(ScreenName.OnboardingDeviceSelection);
  }, [dispatch, identifyUser, navigation]);

  const accessExistingWallet = useCallback(() => {
    dispatch(setReadOnlyMode(false));
    identifyUser(true);
    navigation.navigate(ScreenName.OnboardingWelcomeBack);
  }, [dispatch, identifyUser, navigation]);

  return (
    <Flex flex={1} mx={6} mt={3}>
      <TrackScreen category="Onboarding" name="Get Started" />
      <Text variant="h4" fontWeight="semiBold" mb={7}>
        {t("onboarding.postWelcomeStep.title")}
      </Text>

      <StyledStatusBar barStyle="dark-content" />

      <SelectionCard
        title={t("onboarding.postWelcomeStep.setupLedger.title")}
        subTitle={t("onboarding.postWelcomeStep.setupLedger.subtitle")}
        event="button_clicked"
        eventProperties={{
          button: "Setup your Ledger",
        }}
        testID={`Onboarding PostWelcome - Selection|Setup your Ledger`}
        onPress={setupLedger}
        Icon={<Icons.PlusMedium color={colors.primary.c80} size={14} />}
      />

      <Box mt={6}>
        <SelectionCard
          title={t("onboarding.postWelcomeStep.accessWallet.title")}
          subTitle={t("onboarding.postWelcomeStep.accessWallet.subtitle")}
          event="button_clicked"
          eventProperties={{
            button: "Access an existing wallet",
          }}
          testID={`Onboarding PostWelcome - Selection|Access an existing wallet`}
          onPress={accessExistingWallet}
          Icon={<Icons.PlusMedium color={colors.primary.c80} size={14} />}
        />
      </Box>

      <Button type="default" mt="auto" mb={11} onPress={openModal}>
        {t("onboarding.postWelcomeStep.noLedgerYet")}
      </Button>

      <NoLedgerYetModal isOpen={isNoLedgerModalOpen} onClose={closeModal} />
    </Flex>
  );
}

export default PostWelcomeSelection;
