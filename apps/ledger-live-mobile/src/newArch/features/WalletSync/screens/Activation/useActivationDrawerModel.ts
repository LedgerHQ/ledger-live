import { useCallback, useEffect, useMemo, useState } from "react";
import { Steps } from "../../types/Activation";
import {
  AnalyticsButton,
  AnalyticsPage,
  useLedgerSyncAnalytics,
} from "../../hooks/useLedgerSyncAnalytics";
import { useQRCodeHost } from "../../hooks/useQRCodeHost";
import { Options } from "LLM/features/WalletSync/types/Activation";
import { NavigatorName, ScreenName } from "~/const";
import { useNavigation } from "@react-navigation/native";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { useCurrentStep } from "../../hooks/useCurrentStep";
import { useDispatch } from "react-redux";
import { blockPasswordLock } from "~/actions/appstate";

type Props = {
  isOpen: boolean;
  startingStep: Steps;
  handleClose: () => void;
};

type NavigationProps = BaseComposite<
  StackNavigatorProps<WalletSyncNavigatorStackParamList, ScreenName.WalletSyncActivationProcess>
>;

const useActivationDrawerModel = ({ isOpen, startingStep, handleClose }: Props) => {
  const { onClickTrack } = useLedgerSyncAnalytics();
  const { currentStep, setCurrentStep } = useCurrentStep();

  const dispatch = useDispatch();

  useEffect(() => {
    setCurrentStep(startingStep);
  }, [startingStep, isOpen, setCurrentStep]);

  const [currentOption, setCurrentOption] = useState<Options>(Options.SCAN);
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const hasCustomHeader = useMemo(() => currentStep === Steps.QrCodeMethod, [currentStep]);
  const canGoBack = useMemo(
    () => currentStep === Steps.ChooseSyncMethod && startingStep === Steps.Activation,
    [currentStep, startingStep],
  );

  const getPreviousStep = useCallback(
    (step: Steps): Steps => {
      switch (step) {
        case Steps.ChooseSyncMethod:
          return Steps.Activation;
        case Steps.QrCodeMethod:
          return Steps.ChooseSyncMethod;
        default:
          return startingStep;
      }
    },
    [startingStep],
  );

  const navigateToChooseSyncMethod = () => setCurrentStep(Steps.ChooseSyncMethod);

  const navigateToQrCodeMethod = () => {
    onClickTrack({
      button: AnalyticsButton.ScanQRCode,
      page: AnalyticsPage.ChooseSyncMethod,
    });

    dispatch(blockPasswordLock(true));
    setCurrentStep(Steps.QrCodeMethod);
  };

  const onQrCodeScanned = () => setCurrentStep(Steps.PinInput);

  const resetStep = () => setCurrentStep(startingStep);
  const resetOption = () => setCurrentOption(Options.SCAN);
  const goBackToPreviousStep = () => setCurrentStep(getPreviousStep(currentStep));

  const onCloseDrawer = () => {
    dispatch(blockPasswordLock(false));
    resetStep();
    resetOption();
    handleClose();
  };

  const onCreateKey = () => {
    navigation.navigate(NavigatorName.WalletSync, {
      screen: ScreenName.WalletSyncActivationProcess,
    });
  };

  const { url, error, isLoading, pinCode } = useQRCodeHost({
    currentOption,
  });

  return {
    isOpen,
    hasCustomHeader,
    canGoBack,
    navigateToChooseSyncMethod,
    navigateToQrCodeMethod,
    onQrCodeScanned,
    onCloseDrawer,
    handleClose,
    goBackToPreviousStep,
    qrProcess: { url, error, isLoading, pinCode },
    currentOption,
    setCurrentOption,
    onCreateKey,
  };
};

export default useActivationDrawerModel;
