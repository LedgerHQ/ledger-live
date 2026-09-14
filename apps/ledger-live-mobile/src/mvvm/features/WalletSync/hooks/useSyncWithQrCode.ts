import { useCallback, useState, useRef } from "react";
import { MemberCredentials, TrustchainMember } from "@ledgerhq/ledger-key-ring-protocol/types";
import { createQRCodeCandidateInstance } from "@ledgerhq/ledger-key-ring-protocol/qrcode/index";
import { NoTrustchainInitialized } from "@ledgerhq/ledger-key-ring-protocol/errors";
import { setTrustchain, trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { useSelector, useDispatch } from "~/context/hooks";
import { useNavigation } from "@react-navigation/native";
import { AnalyticsEvents } from "LLM/features/WalletSync/Analytics/enums";
import { track } from "~/analytics";
import { useWalletSyncTrackingFlow } from "./useLedgerSyncAnalytics";
import { Steps } from "../types/Activation";
import { NavigatorName, ScreenName } from "~/const";
import { useInstanceName } from "./useInstanceName";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { useCurrentStep } from "./useCurrentStep";

function resolveSyncErrorStep(error: unknown, trustchainRootId?: string): Steps | undefined {
  const errorName = (error as { name?: string })?.name;

  switch (errorName) {
    case "ScannedOldImportQrCode":
      return Steps.ScannedOldImportQrCode;
    case "ScannedInvalidQrCode":
      return Steps.ScannedInvalidQrCode;
    case "InvalidDigitsError":
      return Steps.SyncError;
    case "NoTrustchainInitialized":
      return Steps.UnbackedError;
    case "TrustchainAlreadyInitialized":
      return (error as Error)?.message === trustchainRootId
        ? Steps.AlreadyBacked
        : Steps.BackedWithDifferentSeeds;
    case "TrustchainAlreadyInitializedWithOtherSeed":
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
  const trustchain = useSelector(trustchainSelector);
  const sdk = useTrustchainSdk();

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
    async (url: string, memberCredentials: MemberCredentials) => {
      try {
        const newTrustchain = await createQRCodeCandidateInstance({
          memberCredentials,
          scannedUrl: url,
          memberName: instanceName,
          onRequestQRCodeInput,
          addMember: async (member: TrustchainMember) => {
            if (trustchain) {
              await sdk.addMember(trustchain, memberCredentials, member);
              return trustchain;
            }
            throw new NoTrustchainInitialized();
          },
          initialTrustchainId: trustchain?.rootId,
        });
        if (newTrustchain) {
          dispatch(setTrustchain(newTrustchain));
          if (!trustchain) track(AnalyticsEvents.LedgerSyncActivated, { flow: trackingFlow });
        }
        onSyncFinished();
        return true;
      } catch (e) {
        const errorStep = resolveSyncErrorStep(e, trustchain?.rootId);
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
      trustchain,
      onSyncFinished,
      sdk,
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
