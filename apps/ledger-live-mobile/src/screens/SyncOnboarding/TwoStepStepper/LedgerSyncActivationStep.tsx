import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Flex, Text, VerticalTimeline } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useNavigation } from "@react-navigation/native";
import IconsHeader from "LLM/features/WalletSync/components/Activation/IconsHeader";
import { setFromLedgerSyncOnboarding, setOnboardingType } from "~/actions/settings";
import { OnboardingType } from "~/reducers/types";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { NavigatorName, ScreenName } from "~/const";
import SkipLedgerSyncDrawer from "./SkipLedgerSyncDrawer";
import { useDispatch } from "~/context/store";
import { TrackScreen, track, screen } from "~/analytics";
import { SeedOriginType } from "@ledgerhq/types-live";

const { BodyText } = VerticalTimeline;

type NavigationProps = BaseComposite<
  StackNavigatorProps<WalletSyncNavigatorStackParamList, ScreenName.WalletSyncActivationProcess>
>;

const LedgerSyncActivationStep = ({
  handleContinue,
  isLedgerSyncActive,
  device,
  analyticsSeedConfiguration,
}: {
  handleContinue: () => void;
  isLedgerSyncActive: boolean;
  device: Device;
  analyticsSeedConfiguration: React.MutableRefObject<SeedOriginType | undefined>;
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const handleSyncActivation = useCallback(() => {
    dispatch(setFromLedgerSyncOnboarding(true));
    dispatch(setOnboardingType(OnboardingType.setupNew));

    navigation.navigate(NavigatorName.WalletSync, {
      screen: ScreenName.WalletSyncActivationProcess,
      params: {
        device,
      },
    });
  }, [device, dispatch, navigation]);

  const handleSyncContinue = useCallback(() => {
    track("button_clicked", {
      button: "Continue",
      seedConfiguration: analyticsSeedConfiguration.current,
      flow: "onboarding",
    });
    handleSyncActivation();
  }, [handleSyncActivation]);

  const handleSkiptCTA = useCallback(() => {
    track("button_clicked", {
      button: "Maybe later",
      seedConfiguration: analyticsSeedConfiguration.current,
      flow: "onboarding",
    });
    setIsDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => setIsDrawerOpen(false), []);

  const handlSyncOpenFromDrawer = useCallback(() => {
    track("button_clicked", {
      button: "Enable sync",
      seedConfiguration: analyticsSeedConfiguration.current,
      flow: "onboarding",
    });
    handleDrawerClose();
    handleSyncActivation();
  }, [handleDrawerClose, handleSyncActivation]);

  const handleSkip = useCallback(() => {
    track("button_clicked", {
      button: "Yes, skip",
      seedConfiguration: analyticsSeedConfiguration.current,
      flow: "onboarding",
    });
    screen(
      "Set up device: Step 4 Ledger Sync Reject",
      undefined,
      {
        seedConfiguration: analyticsSeedConfiguration.current,
        flow: "onboarding",
      },
      true,
      true,
    );
    handleDrawerClose();
    handleContinue();
  }, [handleDrawerClose, handleContinue]);

  return (
    <>
      <TrackScreen
        category="Set up device: Step 4 Ledger Sync"
        flow="onboarding"
        seedConfiguration={analyticsSeedConfiguration}
      />
      <Flex justifyContent="center">
        <IconsHeader />
        <Flex mt={3} alignItems="center" justifyContent="center">
          <Text variant="h5" fontWeight="semiBold">
            {t("syncOnboarding.syncStep.descriptionTitle")}
          </Text>
          <BodyText variant="body" textAlign="center">
            {t("syncOnboarding.syncStep.description")}
          </BodyText>
        </Flex>
        {!isLedgerSyncActive && (
          <Button mb={3} mt={4} size="small" type="main" onPress={handleSyncContinue}>
            {t("common.continue")}
          </Button>
        )}
        {!isLedgerSyncActive && (
          <Button size="small" onPress={handleSkiptCTA}>
            {t("syncOnboarding.syncStep.skipCta")}
          </Button>
        )}
      </Flex>
      <SkipLedgerSyncDrawer
        isOpen={isDrawerOpen}
        handleClose={handleDrawerClose}
        openSync={handlSyncOpenFromDrawer}
        skipSync={handleSkip}
        seedConfiguration={analyticsSeedConfiguration}
      />
    </>
  );
};

export default LedgerSyncActivationStep;
