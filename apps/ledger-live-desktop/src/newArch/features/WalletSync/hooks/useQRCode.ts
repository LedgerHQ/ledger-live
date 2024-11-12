import { useCallback, useState } from "react";
import { createQRCodeHostInstance } from "@ledgerhq/ledger-key-ring-protocol/qrcode/index";
import {
  InvalidDigitsError,
  NoTrustchainInitialized,
  QRCodeWSClosed,
  TrustchainAlreadyInitialized,
} from "@ledgerhq/ledger-key-ring-protocol/errors";
import { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useDispatch, useSelector } from "react-redux";
import { setFlow, setQrCodePinCode } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import {
  trustchainSelector,
  memberCredentialsSelector,
  setTrustchain,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { track } from "~/renderer/analytics/segment";
import { QueryKey } from "./type.hooks";
import { useInstanceName } from "./useInstanceName";

const MIN_TIME_TO_REFRESH = 30_000;

export function useQRCode() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);
  const sdk = useTrustchainSdk();
  const featureWalletSync = useFeature("lldWalletSync");
  const { trustchainApiBaseUrl } = getWalletSyncEnvironmentParams(
    featureWalletSync?.params?.environment,
  );
  const [url, setUrl] = useState<string | null>(null);
  const memberName = useInstanceName();

  const goToActivation = useCallback(() => {
    dispatch(setFlow({ flow: Flow.Activation, step: Step.DeviceAction }));
  }, [dispatch]);

  const { mutate, isPending, error } = useMutation({
    mutationFn: (memberCredentials: MemberCredentials) =>
      createQRCodeHostInstance({
        trustchainApiBaseUrl,
        onDisplayQRCode: url => {
          setUrl(url);
        },
        onDisplayDigits: digits => {
          dispatch(setQrCodePinCode(digits));
          dispatch(setFlow({ flow: Flow.Synchronize, step: Step.PinCode }));
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

    // Don't use retry here because it always uses a delay despite setting it to 0
    onError(e) {
      if (e instanceof QRCodeWSClosed) {
        const { time } = e as unknown as { time: number };
        if (time >= MIN_TIME_TO_REFRESH) startQRCodeProcessing();
      }
      if (e instanceof InvalidDigitsError) {
        dispatch(setFlow({ flow: Flow.Synchronize, step: Step.PinCodeError }));
      }
      if (e instanceof NoTrustchainInitialized) {
        dispatch(setFlow({ flow: Flow.Synchronize, step: Step.UnbackedError }));
      }
      if (e instanceof TrustchainAlreadyInitialized) {
        dispatch(setFlow({ flow: Flow.Synchronize, step: Step.SynchronizeWithQRCode }));
      }
    },

    onSuccess(newTrustchain) {
      if (newTrustchain) {
        dispatch(setTrustchain(newTrustchain));
        if (!trustchain) track("ledgersync_activated");
      }
      dispatch(
        setFlow({
          flow: Flow.Synchronize,
          step: Step.SynchronizeLoading,
          nextStep: Step.Synchronized,
          hasTrustchainBeenCreated: false,
        }),
      );
      queryClient.invalidateQueries({ queryKey: [QueryKey.getMembers] });
      setUrl(null);
      dispatch(setQrCodePinCode(null));
    },
  });

  const startQRCodeProcessing = useCallback(() => {
    if (memberCredentials) mutate(memberCredentials);
  }, [mutate, memberCredentials]);

  return {
    url,
    error,
    isLoading: isPending,
    startQRCodeProcessing,
    goToActivation,
  };
}
