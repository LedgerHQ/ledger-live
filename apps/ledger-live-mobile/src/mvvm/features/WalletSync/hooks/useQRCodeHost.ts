import { useEffect, useState } from "react";
import { useLedgerSyncPairingHost } from "@features/flow-ledger-sync";
import { useWalletSyncTrackingFlow } from "./useLedgerSyncAnalytics";
import { useKeyRingClient } from "./useKeyRingClient";
import { Options, Steps } from "../types/Activation";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { useInstanceName } from "./useInstanceName";
import { useCurrentStep } from "./useCurrentStep";

interface Props {
  currentOption: Options;
}

export function useQRCodeHost({ currentOption }: Props) {
  const { currentStep, setCurrentStep } = useCurrentStep();
  const client = useKeyRingClient();

  const memberName = useInstanceName();

  const [pinCode, setPinCode] = useState<string | null>(null);

  const navigation = useNavigation();
  const trackingFlow = useWalletSyncTrackingFlow();

  const { url, error, isLoading, start } = useLedgerSyncPairingHost({
    client,
    memberName,
    // Restarts when the member key changes, not when the key tree does.
    startBinding: "member-key",
    notifyPaired: "after-members-refresh",
    onDisplayDigits: digits => {
      setPinCode(digits);
      setCurrentStep(Steps.PinDisplay);
    },
    onPaired: () =>
      navigation.navigate(NavigatorName.WalletSync, {
        screen: ScreenName.WalletSyncLoading,
        params: {
          created: false,
        },
      }),
    onDigitsCleared: () => setPinCode(null),
    getActivatedEventProperties: () => ({ flow: trackingFlow }),
    onFailure: ({ category }) => {
      if (category === "pairing-invalid-code" || category === "pairing-protocol") {
        setCurrentStep(Steps.SyncError);
      }
      if (category === "no-tree-for-seed") {
        setCurrentStep(Steps.UnbackedError);
      }
    },
  });

  useEffect(() => {
    if (currentStep === Steps.QrCodeMethod && currentOption === Options.SHOW_QR) {
      start();
    }
  }, [currentOption, currentStep, start]);

  return {
    url,
    error,
    isLoading,
    startQRCodeProcessing: start,
    pinCode,
  };
}
