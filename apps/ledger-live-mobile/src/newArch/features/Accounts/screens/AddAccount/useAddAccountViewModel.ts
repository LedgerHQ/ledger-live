import { useCallback, useEffect, useMemo, useState } from "react";
import { track } from "~/analytics";
import { useQRCodeHost } from "LLM/features/WalletSync/hooks/useQRCodeHost";
import { Options, Steps } from "LLM/features/WalletSync/types/Activation";
import { NavigatorName, ScreenName } from "~/const";
import { useNavigation } from "@react-navigation/native";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { useCurrentStep } from "LLM/features/WalletSync/hooks/useCurrentStep";
import { blockPasswordLock } from "~/actions/appstate";
import { useDispatch, useSelector } from "react-redux";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

type AddAccountDrawerProps = {
  isOpened: boolean;
  onClose: () => void;
};

type NavigationProps = BaseComposite<
  StackNavigatorProps<WalletSyncNavigatorStackParamList, ScreenName.WalletSyncActivationProcess>
>;

const useAddAccountViewModel = ({ isOpened, onClose }: AddAccountDrawerProps) => {
  const dispatch = useDispatch();
  const { currentStep, setCurrentStep } = useCurrentStep();
  const trustchain = useSelector(trustchainSelector);
  const ledgerSyncOptimisationFlag = useFeature("lwmLedgerSyncOptimisation");

  const startingStep = useMemo(
    () =>
      ledgerSyncOptimisationFlag?.enabled && trustchain?.rootId
        ? Steps.ChooseSyncMethod
        : Steps.AddAccountMethod,
    [ledgerSyncOptimisationFlag?.enabled, trustchain?.rootId],
  );
  const [currentOption, setCurrentOption] = useState<Options>(Options.SCAN);
  const navigateToChooseSyncMethod = () => {
    dispatch(blockPasswordLock(true)); // Avoid Background on Android
    setCurrentStep(Steps.ChooseSyncMethod);
  };
  const navigateToQrCodeMethod = () => {
    dispatch(blockPasswordLock(true)); // Avoid Background on Android
    setCurrentStep(Steps.QrCodeMethod);
  };
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const onGoBack = () => setCurrentStep(getPreviousStep(currentStep));

  useEffect(() => {
    setCurrentStep(startingStep);
  }, [isOpened, setCurrentStep, startingStep]);

  const reset = () => {
    dispatch(blockPasswordLock(false));
    setCurrentStep(startingStep);
    setCurrentOption(Options.SCAN);
  };

  const getPreviousStep = useCallback(
    (step: Steps): Steps => {
      switch (step) {
        case Steps.QrCodeMethod:
          return Steps.ChooseSyncMethod;
        case Steps.ChooseSyncMethod:
          return startingStep;
        default:
          return startingStep;
      }
    },
    [startingStep],
  );

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
