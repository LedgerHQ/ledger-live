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
import { useDispatch, useSelector } from "~/context/hooks";
import { blockPasswordLock } from "~/actions/appstate";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { openRebornBuyDeviceDrawer } from "~/reducers/rebornBuyDeviceDrawer";
import { useQueuedDrawerContext } from "LLM/components/QueuedDrawer/QueuedDrawersContext";

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
  const { closeAllDrawers } = useQueuedDrawerContext();

  const dispatch = useDispatch();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

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

  const goBackToPreviousStep = () => setCurrentStep(getPreviousStep(currentStep));

  const onCloseDrawer = useCallback(() => {
    dispatch(blockPasswordLock(false));
    setCurrentStep(startingStep);
    setCurrentOption(Options.SCAN);
    handleClose();
  }, [dispatch, handleClose, startingStep, setCurrentStep]);

  const navigateToWalletSyncActivationProcess = useCallback(() => {
    onCloseDrawer();
    closeAllDrawers();
    navigation.navigate(NavigatorName.WalletSync, {
      screen: ScreenName.WalletSyncActivationProcess,
    });
  }, [onCloseDrawer, closeAllDrawers, navigation]);

  const onCreateKey = useCallback(() => {
    if (readOnlyModeEnabled) {
      handleClose();
      dispatch(openRebornBuyDeviceDrawer());
    } else {
      navigateToWalletSyncActivationProcess();
    }
  }, [readOnlyModeEnabled, handleClose, dispatch, navigateToWalletSyncActivationProcess]);

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
    navigateToWalletSyncActivationProcess,
  };
};

export default useActivationDrawerModel;
