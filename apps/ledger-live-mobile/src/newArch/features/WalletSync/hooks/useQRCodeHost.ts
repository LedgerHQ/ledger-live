import { useCallback, useEffect, useState } from "react";
import { createQRCodeHostInstance } from "@ledgerhq/ledger-key-ring-protocol/qrcode/index";
import {
  InvalidDigitsError,
  NoTrustchainInitialized,
  QRCodeWSClosed,
} from "@ledgerhq/ledger-key-ring-protocol/errors";
import { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useDispatch, useSelector } from "react-redux";
import {
  trustchainSelector,
  memberCredentialsSelector,
  setTrustchain,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { AnalyticsEvents } from "~/newArch/features/Analytics/enums";
import { track } from "~/analytics";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { Options, Steps } from "../types/Activation";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
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
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);
  const sdk = useTrustchainSdk();
  const dispatch = useDispatch();

  const featureWalletSync = useFeature("llmWalletSync");
  const { trustchainApiBaseUrl } = getWalletSyncEnvironmentParams(
    featureWalletSync?.params?.environment,
  );
  const memberName = useInstanceName();

  const [url, setUrl] = useState<string | null>(null);
  const [pinCode, setPinCode] = useState<string | null>(null);

  const navigation = useNavigation();

  const { mutate, isPending, error } = useMutation({
    mutationFn: (memberCredentials: MemberCredentials) =>
      createQRCodeHostInstance({
        trustchainApiBaseUrl,
        onDisplayQRCode: url => {
          setUrl(url);
        },
        onDisplayDigits: digits => {
          setPinCode(digits);
          setCurrentStep(Steps.PinDisplay);
        },
        addMember: async member => {
          if (trustchain) {
            await sdk.addMember(trustchain, memberCredentials, member);
            return trustchain;
          }
          throw new NoTrustchainInitialized();
        },
        memberCredentials,
        memberName,
        initialTrustchainId: trustchain?.rootId,
      }),

    onSuccess: newTrustchain => {
      if (newTrustchain) {
        dispatch(setTrustchain(newTrustchain));
        if (!trustchain) track(AnalyticsEvents.LedgerSyncActivated);
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
      if (e instanceof QRCodeWSClosed) {
        const { time } = e as unknown as { time: number };
        if (time >= MIN_TIME_TO_REFRESH) startQRCodeProcessing();
      }
      if (e instanceof InvalidDigitsError) {
        setCurrentStep(Steps.SyncError);
      }
      if (e instanceof NoTrustchainInitialized) {
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
