import { track } from "@shared/analytics";
import { useCallback, useEffect, useState } from "react";
import {
  classifyKeyRingError,
  commitKeyRingTree,
  hasKeyRingMemberKey,
  isSameKeyRingMember,
  KeyRingPairingClosedError,
  selectKeyRingSession,
} from "@features/platform-key-ring";
import { selectIsKeyRingMember } from "@domain/entity-key-ring";
import { useSelector, useDispatch } from "~/context/hooks";
import { AnalyticsEvents } from "LLM/features/WalletSync/Analytics/enums";
import { useWalletSyncTrackingFlow } from "./useLedgerSyncAnalytics";
import { useKeyRingClient } from "./useKeyRingClient";
import { Options, Steps } from "../types/Activation";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "./type.hooks";
import { useInstanceName } from "./useInstanceName";
import { useCurrentStep } from "./useCurrentStep";

const MIN_TIME_TO_REFRESH = 30_000;

interface Props {
  currentOption: Options;
}

export function useQRCodeHost({ currentOption }: Props) {
  const { currentStep, setCurrentStep } = useCurrentStep();
  const queryClient = useQueryClient();
  const session = useSelector(selectKeyRingSession);
  const memberKeySession = useSelector(selectKeyRingSession, isSameKeyRingMember);
  const isMember = useSelector(selectIsKeyRingMember);
  const client = useKeyRingClient();
  const dispatch = useDispatch();

  const memberName = useInstanceName();

  const [url, setUrl] = useState<string | null>(null);
  const [pinCode, setPinCode] = useState<string | null>(null);

  const navigation = useNavigation();
  const trackingFlow = useWalletSyncTrackingFlow();

  const { mutate, isPending, error } = useMutation({
    mutationFn: () =>
      client.hostPairing(session, {
        memberName,
        onDisplayQRCode: url => {
          setUrl(url);
        },
        onDisplayDigits: digits => {
          setPinCode(digits);
          setCurrentStep(Steps.PinDisplay);
        },
      }),

    onSuccess: newTree => {
      if (newTree) {
        dispatch(commitKeyRingTree(newTree));
        if (!isMember) track(AnalyticsEvents.LedgerSyncActivated, { flow: trackingFlow });
      }
      queryClient.invalidateQueries({ queryKey: [QueryKey.getMembers] });
      navigation.navigate(NavigatorName.WalletSync, {
        screen: ScreenName.WalletSyncLoading,
        params: {
          created: false,
        },
      });

      setUrl(null);
      setPinCode(null);
    },

    // Don't use retry here because it always uses a delay despite setting it to 0
    onError: e => {
      const category = classifyKeyRingError(e);
      if (category === "pairing-closed") {
        const time = e instanceof KeyRingPairingClosedError ? e.elapsedMs : undefined;
        if (time !== undefined && time >= MIN_TIME_TO_REFRESH) startQRCodeProcessing();
      }
      if (category === "pairing-invalid-code" || category === "pairing-protocol") {
        setCurrentStep(Steps.SyncError);
      }
      if (category === "no-tree-for-seed") {
        setCurrentStep(Steps.UnbackedError);
      }
    },
  });

  // Restarts when the member key changes, not when the key tree does.
  const startQRCodeProcessing = useCallback(() => {
    if (hasKeyRingMemberKey(memberKeySession)) mutate();
  }, [mutate, memberKeySession]);

  useEffect(() => {
    if (currentStep === Steps.QrCodeMethod && currentOption === Options.SHOW_QR) {
      startQRCodeProcessing();
    }
  }, [currentOption, currentStep, startQRCodeProcessing]);

  return {
    url,
    error,
    isLoading: isPending,
    startQRCodeProcessing,
    pinCode,
  };
}
