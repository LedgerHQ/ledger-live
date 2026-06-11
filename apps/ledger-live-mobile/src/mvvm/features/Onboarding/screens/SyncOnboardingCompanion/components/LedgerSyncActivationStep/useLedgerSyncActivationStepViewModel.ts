import { useCallback, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { setFromLedgerSyncOnboarding, setOnboardingType } from "~/actions/settings";
import { OnboardingType } from "~/reducers/types";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { NavigatorName, ScreenName } from "~/const";
import { useDispatch } from "~/context/hooks";
import { track, screen } from "~/analytics";
import type { LedgerSyncActivationStepProps } from "./types";

type NavigationProps = BaseComposite<
  StackNavigatorProps<WalletSyncNavigatorStackParamList, ScreenName.WalletSyncActivationProcess>
>;

export const useLedgerSyncActivationStepViewModel = ({
  handleContinue,
  isLedgerSyncActive,
  device,
  analyticsSeedConfiguration,
}: LedgerSyncActivationStepProps) => {
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
  }, [handleSyncActivation, analyticsSeedConfiguration]);

  const handleSkipCTA = useCallback(() => {
    track("button_clicked", {
      button: "Maybe later",
      seedConfiguration: analyticsSeedConfiguration.current,
      flow: "onboarding",
    });
    setIsDrawerOpen(true);
  }, [analyticsSeedConfiguration]);

  const handleDrawerClose = useCallback(() => setIsDrawerOpen(false), []);

  const handleSyncOpenFromDrawer = useCallback(() => {
    track("button_clicked", {
      button: "Enable sync",
      seedConfiguration: analyticsSeedConfiguration.current,
      flow: "onboarding",
    });
    handleDrawerClose();
    handleSyncActivation();
  }, [handleDrawerClose, handleSyncActivation, analyticsSeedConfiguration]);

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
  }, [handleDrawerClose, handleContinue, analyticsSeedConfiguration]);

  return {
    isLedgerSyncActive,
    isDrawerOpen,
    analyticsSeedConfiguration,
    handleSyncContinue,
    handleSkipCTA,
    handleDrawerClose,
    handleSyncOpenFromDrawer,
    handleSkip,
  };
};

export type LedgerSyncActivationStepViewProps = ReturnType<
  typeof useLedgerSyncActivationStepViewModel
>;
