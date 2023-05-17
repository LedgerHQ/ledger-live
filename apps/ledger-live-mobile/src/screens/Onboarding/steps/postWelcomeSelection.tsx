import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, Flex, Box, Button, Icons } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { useDispatch } from "react-redux";

import { useTheme } from "styled-components/native";
import { TrackScreen } from "../../../analytics";
import { ScreenName } from "../../../const";
import StyledStatusBar from "../../../components/StyledStatusBar";

import { setReadOnlyMode } from "../../../actions/settings";
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

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);
  const setupLedger = useCallback(() => {
    dispatch(setReadOnlyMode(false));
    navigation.navigate(ScreenName.OnboardingDeviceSelection);
  }, [dispatch, navigation]);

  const accessExistingWallet = useCallback(() => {
    dispatch(setReadOnlyMode(false));
    navigation.navigate(ScreenName.OnboardingWelcomeBack);
  }, [dispatch, navigation]);

  return (
    <Flex flex={1} mx={6} mt={3}>
      <TrackScreen category="Onboarding" name={""} />
      <TrackScreen category="Onboarding" name="SelectDevice" />
      <Text variant="h4" fontWeight="semiBold" mb={7}>
        {t("onboarding.postWelcomeStep.title")}
      </Text>

      <StyledStatusBar barStyle="dark-content" />

      <SelectionCard
        title={t("onboarding.postWelcomeStep.setupLedger.title")}
        subTitle={t("onboarding.postWelcomeStep.setupLedger.subtitle")}
        event="banner_clicked"
        eventProperties={{
          banner: "Explore LL",
        }}
        testID={`Onboarding PostWelcome - Selection|ExploreLedger`}
        onPress={setupLedger}
        Icon={<Icons.PlusMedium color={colors.primary.c80} size={14} />}
      />

      <Box mt={6}>
        <SelectionCard
          title={t("onboarding.postWelcomeStep.accessWallet.title")}
          subTitle={t("onboarding.postWelcomeStep.accessWallet.subtitle")}
          event="banner_clicked"
          eventProperties={{
            banner: "Explore LL",
          }}
          testID={`Onboarding PostWelcome - Selection|ExploreLedger`}
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
