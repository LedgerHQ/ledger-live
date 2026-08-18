import { track } from "~/renderer/analytics/segment";
import { resetTrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import { useDispatch } from "LLD/hooks/redux";
import { ErrorType } from "./type.hooks";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useRestoreTrustchain } from "./useRestoreTrustchain";
import { useTrustchainSdk } from "./useTrustchainSdk";

export const useLifeCycle = () => {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();

  const { refetch: restoreTrustchain } = useRestoreTrustchain();

  function reset() {
    dispatch(resetTrustchainStore());
    track("ledgersync_deactivated");
    dispatch(setFlow({ flow: Flow.Activation, step: Step.CreateOrSynchronize }));
    sdk.invalidateJwt();
  }

  const includesErrorActions: { [key: string]: () => void } = {
    [ErrorType.NO_TRUSTCHAIN]: () => reset(),
  };

  function handleError(error: Error) {
    console.error("GetMember :" + error);

    if (error?.name === "TrustchainEjected") reset();
    if (error?.name === "TrustchainNotAllowed") reset();

    if (error?.name === "TrustchainOutdated") restoreTrustchain();

    const errorToHandle = Object.entries(includesErrorActions).find(([err, _action]) =>
      error.message.includes(err),
    );

    if (errorToHandle) errorToHandle[1]();
  }

  return {
    handleError,
  };
};
