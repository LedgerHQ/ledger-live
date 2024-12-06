import { useCallback, useState, useRef } from "react";
import { MemberCredentials, TrustchainMember } from "@ledgerhq/ledger-key-ring-protocol/types";
import { createQRCodeCandidateInstance } from "@ledgerhq/ledger-key-ring-protocol/qrcode/index";
import {
  ScannedOldImportQrCode,
  ScannedInvalidQrCode,
  InvalidDigitsError,
  NoTrustchainInitialized,
  TrustchainAlreadyInitialized,
  TrustchainAlreadyInitializedWithOtherSeed,
} from "@ledgerhq/ledger-key-ring-protocol/errors";
import { setTrustchain, trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { AnalyticsEvents } from "~/newArch/features/Analytics/enums";
import { track } from "~/analytics";
import { Steps } from "../types/Activation";
import { NavigatorName, ScreenName } from "~/const";
import { useInstanceName } from "./useInstanceName";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { useCurrentStep } from "./useCurrentStep";

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
          if (!trustchain) track(AnalyticsEvents.LedgerSyncActivated);
        }
        onSyncFinished();
        return true;
      } catch (e) {
        if (e instanceof ScannedOldImportQrCode) {
          setCurrentStep(Steps.ScannedOldImportQrCode);
          return;
        } else if (e instanceof ScannedInvalidQrCode) {
          setCurrentStep(Steps.ScannedInvalidQrCode);
          return;
        } else if (e instanceof InvalidDigitsError) {
          setCurrentStep(Steps.SyncError);
          return;
        } else if (e instanceof NoTrustchainInitialized) {
          setCurrentStep(Steps.UnbackedError);
          return;
        } else if (e instanceof TrustchainAlreadyInitialized) {
          if (e.message === trustchain?.rootId) {
            setCurrentStep(Steps.AlreadyBacked);
          } else {
            setCurrentStep(Steps.BackedWithDifferentSeeds);
          }
          return;
        } else if (e instanceof TrustchainAlreadyInitializedWithOtherSeed) {
          setCurrentStep(Steps.BackedWithDifferentSeeds);
          return;
        }
        throw e;
      }
    },
    [instanceName, onRequestQRCodeInput, trustchain, onSyncFinished, sdk, dispatch, setCurrentStep],
  );

  const handleSendDigits = useCallback(
    (input: string) => (inputCallbackRef.current?.(input), true),
    [],
  );

  return { nbDigits, input, handleStart, handleSendDigits, setInput };
};
