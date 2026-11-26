import { useEffect } from "react";
import { useLedgerSyncLoadingSettled } from "@features/flow-ledger-sync";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { walletSyncFlowSelector, walletSyncNextStepSelector } from "~/renderer/reducers/walletSync";
import { useFeature } from "@features/platform-feature-flags";

export function useLoadingStep() {
  const dispatch = useDispatch();
  const nextStep = useSelector(walletSyncNextStepSelector);
  const flow = useSelector(walletSyncFlowSelector);
  const featureWalletSync = useFeature("lldWalletSync");
  const isSettled = useLedgerSyncLoadingSettled(
    featureWalletSync?.params?.watchConfig?.initialTimeout,
  );

  useEffect(() => {
    if (isSettled && nextStep) {
      dispatch(
        setFlow({
          flow,
          step: nextStep,
          nextStep: null,
          hasTrustchainBeenCreated: null,
        }),
      );
    }
  }, [isSettled, dispatch, flow, nextStep]);
}
