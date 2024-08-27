import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { walletSyncFlowSelector, walletSyncNextStepSelector } from "~/renderer/reducers/walletSync";
import { useWalletSyncUserState } from "../components/WalletSyncContext";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

export function useLoadingStep() {
  const dispatch = useDispatch();
  const [waitedWatchLoop, setWaitedWatchLoop] = useState(false);
  const { visualPending } = useWalletSyncUserState();
  const nextStep = useSelector(walletSyncNextStepSelector);
  const flow = useSelector(walletSyncFlowSelector);
  const featureWalletSync = useFeature("lldWalletSync");
  const initialTimeout = featureWalletSync?.params?.watchConfig?.initialTimeout || 1000;
  const visualPendingTimeout = 1000;

  useEffect(() => {
    const timeout = setTimeout(
      () => {
        setWaitedWatchLoop(true);
      },
      initialTimeout + visualPendingTimeout + 500,
    );

    return () => {
      clearTimeout(timeout);
    };
  }, [initialTimeout]);

  useEffect(() => {
    if (waitedWatchLoop && !visualPending && nextStep) {
      dispatch(
        setFlow({
          flow,
          step: nextStep,
          nextStep: null,
          hasTrustchainBeenCreated: null,
        }),
      );
    }
  }, [waitedWatchLoop, visualPending, dispatch, flow, nextStep]);
}
