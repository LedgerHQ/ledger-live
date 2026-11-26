import { track } from "@shared/analytics";
import { useCallback, useState, useRef } from "react";
import {
  classifyKeyRingError,
  commitKeyRingTree,
  type KeyRingSession,
} from "@features/platform-key-ring";
import { selectIsKeyRingMember, selectKeyRingTreeId } from "@domain/entity-key-ring";
import { useSelector, useDispatch } from "~/context/hooks";
import { useNavigation } from "@react-navigation/native";
import { AnalyticsEvents } from "LLM/features/WalletSync/Analytics/enums";
import { useWalletSyncTrackingFlow } from "./useLedgerSyncAnalytics";
import { Steps } from "../types/Activation";
import { NavigatorName, ScreenName } from "~/const";
import { useInstanceName } from "./useInstanceName";
import { useKeyRingClient } from "./useKeyRingClient";
import { useCurrentStep } from "./useCurrentStep";

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

export const useSyncWithQrCode = () => {
  const { setCurrentStep } = useCurrentStep();
  const [nbDigits, setDigits] = useState<number | null>(null);
  const [input, setInput] = useState<string | null>(null);
  const instanceName = useInstanceName();
  const isMember = useSelector(selectIsKeyRingMember);
  const treeId = useSelector(selectKeyRingTreeId);
  const client = useKeyRingClient();

  const navigation = useNavigation();

  const inputCallbackRef = useRef<((input: string) => void) | null>(null);
  const dispatch = useDispatch();
  const trackingFlow = useWalletSyncTrackingFlow();

  const onRequestQRCodeInput = useCallback(
    (config: { digits: number }, callback: (input: string) => void) => {
      setDigits(config.digits);
      inputCallbackRef.current = callback;
    },
    [],
  );

  const onSyncFinished = useCallback(() => {
    setDigits(null);
    setInput(null);
    inputCallbackRef.current = null;
    navigation.navigate(NavigatorName.WalletSync, {
      screen: ScreenName.WalletSyncLoading,
      params: {
        created: false,
      },
    });
  }, [navigation]);

  const handleStart = useCallback(
    async (url: string, session: KeyRingSession) => {
      try {
        const newTree = await client.joinPairing(session, {
          memberName: instanceName,
          scannedUrl: url,
          onRequestPairingCode: onRequestQRCodeInput,
        });
        if (newTree) {
          dispatch(commitKeyRingTree(newTree));
          if (!isMember) track(AnalyticsEvents.LedgerSyncActivated, { flow: trackingFlow });
        }
        onSyncFinished();
        return true;
      } catch (e) {
        const errorStep = resolveSyncErrorStep(e, treeId);
        if (errorStep) {
          setCurrentStep(errorStep);
          return;
        }
        throw e;
      }
    },
    [
      instanceName,
      onRequestQRCodeInput,
      isMember,
      treeId,
      onSyncFinished,
      client,
      dispatch,
      setCurrentStep,
      trackingFlow,
    ],
  );

  const handleSendDigits = useCallback(
    (input: string) => (inputCallbackRef.current?.(input), true),
    [],
  );

  return { nbDigits, input, handleStart, handleSendDigits, setInput };
};
