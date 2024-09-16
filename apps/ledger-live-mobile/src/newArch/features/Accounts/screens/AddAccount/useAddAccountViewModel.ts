import { useCallback, useEffect, useState } from "react";
import { track } from "~/analytics";
import { useQRCodeHost } from "LLM/features/WalletSync/hooks/useQRCodeHost";
import { Options, Steps } from "LLM/features/WalletSync/types/Activation";
import { NavigatorName, ScreenName } from "~/const";
import { useNavigation } from "@react-navigation/native";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { useCurrentStep } from "LLM/features/WalletSync/hooks/useCurrentStep";
import { blockPasswordLock } from "~/actions/appstate";
import { useDispatch } from "react-redux";

type AddAccountDrawerProps = {
  isOpened: boolean;
  onClose: () => void;
};

type NavigationProps = BaseComposite<
  StackNavigatorProps<WalletSyncNavigatorStackParamList, ScreenName.WalletSyncActivationProcess>
>;

const startingStep = Steps.AddAccountMethod;

const useAddAccountViewModel = ({ isOpened, onClose }: AddAccountDrawerProps) => {
  const dispatch = useDispatch();
  const { currentStep, setCurrentStep } = useCurrentStep();
  const [currentOption, setCurrentOption] = useState<Options>(Options.SCAN);
  const navigateToChooseSyncMethod = () => setCurrentStep(Steps.ChooseSyncMethod);
  const navigateToQrCodeMethod = () => {
    dispatch(blockPasswordLock(true)); // Avoid Background on Android
    setCurrentStep(Steps.QrCodeMethod);
  };
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const onGoBack = () => setCurrentStep(getPreviousStep(currentStep));

  useEffect(() => {
    setCurrentStep(startingStep);
  }, [isOpened, setCurrentStep]);

  const reset = () => {
    dispatch(blockPasswordLock(false));
    setCurrentStep(startingStep);
    setCurrentOption(Options.SCAN);
  };

  const getPreviousStep = useCallback((step: Steps): Steps => {
    switch (step) {
      case Steps.QrCodeMethod:
        return Steps.ChooseSyncMethod;
      case Steps.ChooseSyncMethod:
        return Steps.AddAccountMethod;
      default:
        return startingStep;
    }
  }, []);

  const trackButtonClick = useCallback((button: string) => {
    track("button_clicked", {
      button,
      drawer: "AddAccountsModal",
    });
  }, []);

  const onCloseAddAccountDrawer = () => {
    trackButtonClick("Close 'x'");
    onClose();
    reset();
  };

  const { url, error, isLoading, pinCode } = useQRCodeHost({
    currentOption,
  });

  const onCreateKey = () => {
    navigation.navigate(NavigatorName.WalletSync, {
      screen: ScreenName.WalletSyncActivationProcess,
    });
  };

  const onQrCodeScanned = () => setCurrentStep(Steps.PinInput);

  return {
    isAddAccountDrawerVisible: isOpened,
    onCloseAddAccountDrawer,
    navigateToQrCodeMethod,
    navigateToChooseSyncMethod,
    setCurrentOption,
    currentOption,
    onQrCodeScanned,
    onGoBack,
    qrProcess: {
      url,
      error,
      isLoading,
      pinCode,
    },
    onCreateKey,
  };
};

export default useAddAccountViewModel;
