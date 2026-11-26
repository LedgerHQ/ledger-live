import { useCallback } from "react";
import { useLedgerSyncPairingJoin } from "@features/flow-ledger-sync";
import { classifyKeyRingError } from "@features/platform-key-ring";
import { selectKeyRingTreeId } from "@domain/entity-key-ring";
import { useSelector } from "~/context/hooks";
import { useNavigation } from "@react-navigation/native";
import { useWalletSyncTrackingFlow } from "./useLedgerSyncAnalytics";
import { Steps } from "../types/Activation";
import { NavigatorName, ScreenName } from "~/const";
import { useInstanceName } from "./useInstanceName";
import { useKeyRingClient } from "./useKeyRingClient";
import { useCurrentStep } from "./useCurrentStep";

export function useSyncWithQrCode() {
  const { setCurrentStep } = useCurrentStep();
  const instanceName = useInstanceName();
  const treeId = useSelector(selectKeyRingTreeId);
  const client = useKeyRingClient();

  const navigation = useNavigation();
  const trackingFlow = useWalletSyncTrackingFlow();

  // Stable callbacks: `handleStart` changes identity with them.
  const getActivatedEventProperties = useCallback(() => ({ flow: trackingFlow }), [trackingFlow]);

  const onJoined = useCallback(() => {
    navigation.navigate(NavigatorName.WalletSync, {
      screen: ScreenName.WalletSyncLoading,
      params: {
        created: false,
      },
    });
  }, [navigation]);

  const onFailure = useCallback(
    (error: unknown) => {
      const errorStep = resolveSyncErrorStep(error, treeId);
      if (!errorStep) return false;
      setCurrentStep(errorStep);
      return true;
    },
    [treeId, setCurrentStep],
  );

  const { digitsCount, input, start, sendDigits, setInput } = useLedgerSyncPairingJoin({
    client,
    memberName: instanceName,
    getActivatedEventProperties,
    onJoined,
    onFailure,
  });

  return {
    nbDigits: digitsCount,
    input,
    handleStart: start,
    handleSendDigits: sendDigits,
    setInput,
  };
}

function resolveSyncErrorStep(error: unknown, treeId: string | null): Steps | undefined {
  switch (classifyKeyRingError(error)) {
    case "pairing-outdated-qr-code":
      return Steps.ScannedOldImportQrCode;
    case "pairing-invalid-qr-code":
      return Steps.ScannedInvalidQrCode;
    case "pairing-invalid-code":
    case "pairing-protocol":
      return Steps.SyncError;
    case "no-tree-for-seed":
      return Steps.UnbackedError;
    case "already-member":
      return (error as Error)?.message === (treeId ?? undefined)
        ? Steps.AlreadyBacked
        : Steps.BackedWithDifferentSeeds;
    case "member-of-other-tree":
      return Steps.BackedWithDifferentSeeds;
    default:
      return undefined;
  }
}
