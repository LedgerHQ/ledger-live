import { useNavigation } from "@react-navigation/native";
import React from "react";
import { useSelector } from "react-redux";
import Activation from ".";
import { TrackScreen } from "~/analytics";
import {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import ChooseSyncMethod from "../../screens/Synchronize/ChooseMethod";
import QrCodeMethod from "../../screens/Synchronize/QrCodeMethod";
import { Options, Steps } from "../../types/Activation";
import { AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";
import PinCodeDisplay from "../../screens/Synchronize/PinCodeDisplay";
import PinCodeInput from "../../screens/Synchronize/PinCodeInput";
import SyncError from "../../screens/Synchronize/SyncError";
import ScannedInvalidQrCode from "../../screens/Synchronize/ScannedInvalidQrCode";
import ScannedOldImportQrCode from "../../screens/Synchronize/ScannedOldImportQrCode";
import { useInitMemberCredentials } from "../../hooks/useInitMemberCredentials";
import { useSyncWithQrCode } from "../../hooks/useSyncWithQrCode";
import { SpecificError } from "../Error/SpecificError";
import { ErrorReason } from "../../hooks/useSpecificError";
import { useCurrentStep } from "../../hooks/useCurrentStep";

type Props = {
  navigateToChooseSyncMethod: () => void;
  navigateToQrCodeMethod: () => void;
  qrProcess: {
    url: string | null;
    error: Error | null;
    isLoading: boolean;
    pinCode: string | null;
  };
  onQrCodeScanned: () => void;
  currentOption: Options;
  setOption: (option: Options) => void;
  onCreateKey: () => void;
};

const ActivationFlow = ({
  navigateToChooseSyncMethod,
  navigateToQrCodeMethod,
  qrProcess,
  currentOption,
  setOption,
  onQrCodeScanned,
  onCreateKey,
}: Props) => {
  const { currentStep, setCurrentStep } = useCurrentStep();
  const { memberCredentials } = useInitMemberCredentials();

  const { handleStart, handleSendDigits, inputCallback, nbDigits } = useSyncWithQrCode();

  const handleQrCodeScanned = (data: string) => {
    onQrCodeScanned();
    if (memberCredentials) handleStart(data, memberCredentials);
  };

  const handlePinCodeSubmit = (input: string) => {
    if (input && inputCallback && nbDigits === input.length) handleSendDigits(inputCallback, input);
  };

  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const { navigate } =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();

  const getScene = () => {
    switch (currentStep) {
      case Steps.Activation:
        return (
          <>
            <TrackScreen category={AnalyticsPage.ActivateLedgerSync} />
            <Activation onSyncMethodPress={navigateToChooseSyncMethod} />
          </>
        );
      case Steps.ChooseSyncMethod:
        return (
          <>
            <TrackScreen category={AnalyticsPage.ChooseSyncMethod} />
            <ChooseSyncMethod onScanMethodPress={navigateToQrCodeMethod} />
          </>
        );
      case Steps.QrCodeMethod:
        return (
          <QrCodeMethod
            onQrCodeScanned={handleQrCodeScanned}
            currentOption={currentOption}
            setSelectedOption={setOption}
            qrCodeValue={qrProcess.url}
          />
        );

      case Steps.PinDisplay:
        return qrProcess.pinCode ? <PinCodeDisplay pinCode={qrProcess.pinCode} /> : null;

      case Steps.PinInput:
        return nbDigits ? (
          <PinCodeInput handleSendDigits={handlePinCodeSubmit} nbDigits={nbDigits} />
        ) : null;

      case Steps.SyncError:
        return <SyncError tryAgain={navigateToQrCodeMethod} />;

      case Steps.ScannedInvalidQrCode:
        return <ScannedInvalidQrCode tryAgain={navigateToQrCodeMethod} />;

      case Steps.ScannedOldImportQrCode:
        return <ScannedOldImportQrCode tryAgain={navigateToQrCodeMethod} />;

      case Steps.UnbackedError:
        if (!hasCompletedOnboarding) {
          return (
            <SpecificError
              primaryAction={navigateToQrCodeMethod}
              secondaryAction={() => {
                navigate(NavigatorName.BaseOnboarding, {
                  screen: NavigatorName.Onboarding,
                  params: {
                    screen: ScreenName.OnboardingPostWelcomeSelection,
                    params: { userHasDevice: true },
                  },
                });
              }}
              error={ErrorReason.NO_BACKUP_ONBOARDING_QRCODE}
            />
          );
        }
        return <SpecificError primaryAction={onCreateKey} error={ErrorReason.NO_BACKUP} />;

      case Steps.AlreadyBacked:
        return (
          <SpecificError
            primaryAction={() => setCurrentStep(Steps.QrCodeMethod)}
            error={ErrorReason.ALREADY_BACKED_SCAN}
          />
        );

      case Steps.BackedWithDifferentSeeds:
        return (
          <SpecificError
            primaryAction={() => setCurrentStep(Steps.QrCodeMethod)}
            error={ErrorReason.DIFFERENT_BACKUPS}
          />
        );
      default:
        return null;
    }
  };

  return getScene();
};

export default ActivationFlow;
