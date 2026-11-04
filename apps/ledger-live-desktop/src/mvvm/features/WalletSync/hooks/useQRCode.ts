import { useCallback, useState } from "react";
import { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useDispatch, useSelector, useStore } from "LLD/hooks/redux";
import { setDrawerVisibility, setFlow, setQrCodePinCode } from "~/renderer/actions/walletSync";
import { Flow, Step, walletSyncStepSelector } from "~/renderer/reducers/walletSync";
import {
  trustchainSelector,
  memberCredentialsSelector,
  setTrustchain,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { getLkrpQrCode } from "@features/platform-wallet-sync";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { track } from "@shared/analytics";
import { QueryKey } from "./type.hooks";
import {
  AnalyticsFlow,
  AnalyticsPage,
  walletSyncEntryFlowProperties,
} from "./useLedgerSyncAnalytics";
import { saveSettings } from "~/renderer/actions/settings";
import { useNavigate } from "react-router";

const MIN_TIME_TO_REFRESH = 30_000;

export function useQRCode({ sourcePage }: { sourcePage?: AnalyticsPage }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);
  const store = useStore();
  const [url, setUrl] = useState<string | null>(null);

  const goToActivation = useCallback(() => {
    dispatch(setFlow({ flow: Flow.Activation, step: Step.DeviceAction }));
  }, [dispatch]);

  const { mutate, isPending, error } = useMutation({
    mutationFn: (memberCredentials: MemberCredentials) =>
      getLkrpQrCode(dispatch).host({
        trustchain,
        memberCredentials,
        onDisplayQRCode: url => {
          setUrl(url);
        },
        onDisplayDigits: digits => {
          dispatch(setQrCodePinCode(digits));
          dispatch(setFlow({ flow: Flow.Synchronize, step: Step.PinCode }));
        },
      }),

    // Don't use retry here because it always uses a delay despite setting it to 0
    onError(e) {
      if (e?.name === "QRCodeWSClosed") {
        const { time } = e as unknown as { time: number };
        if (time >= MIN_TIME_TO_REFRESH) startQRCodeProcessing();
      }
      if (e?.name === "InvalidDigitsError") {
        dispatch(setFlow({ flow: Flow.Synchronize, step: Step.PinCodeError }));
      }
      if (e?.name === "QRCodeProtocolError") {
        if (walletSyncStepSelector(store.getState()) === Step.SynchronizeWithQRCode) {
          startQRCodeProcessing();
        } else {
          dispatch(setFlow({ flow: Flow.Synchronize, step: Step.SynchronizeWithQRCode }));
        }
      }
      if (e?.name === "NoTrustchainInitialized") {
        dispatch(setFlow({ flow: Flow.Synchronize, step: Step.UnbackedError }));
      }
      if (e?.name === "TrustchainAlreadyInitialized") {
        dispatch(setFlow({ flow: Flow.Synchronize, step: Step.SynchronizeWithQRCode }));
      }
    },

    onSuccess(newTrustchain) {
      if (newTrustchain) {
        dispatch(setTrustchain(newTrustchain));
        if (!trustchain) {
          track("ledgersync_activated", walletSyncEntryFlowProperties(AnalyticsFlow));
        }
      }
      if (sourcePage === AnalyticsPage.Onboarding) {
        dispatch(saveSettings({ hasCompletedOnboarding: true }));
        navigate("/");
        dispatch(setDrawerVisibility(false));
      } else {
        dispatch(
          setFlow({
            flow: Flow.Synchronize,
            step: Step.SynchronizeLoading,
            nextStep: Step.Synchronized,
            hasTrustchainBeenCreated: false,
          }),
        );
      }
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
