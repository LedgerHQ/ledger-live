import { track } from "@shared/analytics";
import { useCallback, useEffect, useState } from "react";
import { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useSelector, useDispatch } from "~/context/hooks";
import {
  trustchainSelector,
  memberCredentialsSelector,
  setTrustchain,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { AnalyticsEvents } from "LLM/features/WalletSync/Analytics/enums";
import { useWalletSyncTrackingFlow } from "./useLedgerSyncAnalytics";
import { Options, Steps } from "../types/Activation";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { getLkrpQrCode } from "@features/platform-wallet-sync";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "./type.hooks";
import { useCurrentStep } from "./useCurrentStep";

const MIN_TIME_TO_REFRESH = 30_000;

interface Props {
  currentOption: Options;
}

export function useQRCodeHost({ currentOption }: Props) {
  const { currentStep, setCurrentStep } = useCurrentStep();
  const queryClient = useQueryClient();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);
  const dispatch = useDispatch();

  const [url, setUrl] = useState<string | null>(null);
  const [pinCode, setPinCode] = useState<string | null>(null);

  const navigation = useNavigation();
  const trackingFlow = useWalletSyncTrackingFlow();

  const { mutate, isPending, error } = useMutation({
    mutationFn: (memberCredentials: MemberCredentials) =>
      getLkrpQrCode(dispatch).host({
        trustchain,
        memberCredentials,
        onDisplayQRCode: url => {
          setUrl(url);
        },
        onDisplayDigits: digits => {
          setPinCode(digits);
          setCurrentStep(Steps.PinDisplay);
        },
      }),

    onSuccess: newTrustchain => {
      if (newTrustchain) {
        dispatch(setTrustchain(newTrustchain));
        if (!trustchain) track(AnalyticsEvents.LedgerSyncActivated, { flow: trackingFlow });
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
      if (e?.name === "QRCodeWSClosed") {
        const { time } = e as unknown as { time: number };
        if (time >= MIN_TIME_TO_REFRESH) startQRCodeProcessing();
      }
      if (e?.name === "InvalidDigitsError" || e?.name === "QRCodeProtocolError") {
        setCurrentStep(Steps.SyncError);
      }
      if (e?.name === "NoTrustchainInitialized") {
        setCurrentStep(Steps.UnbackedError);
      }
    },
  });

  const startQRCodeProcessing = useCallback(() => {
    if (memberCredentials) mutate(memberCredentials);
  }, [mutate, memberCredentials]);

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
