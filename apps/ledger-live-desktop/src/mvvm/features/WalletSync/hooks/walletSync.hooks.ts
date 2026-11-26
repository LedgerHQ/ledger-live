import { track } from "@shared/analytics";
import { classifyKeyRingError, resetKeyRingState } from "@features/platform-key-ring";
import { useDispatch } from "LLD/hooks/redux";
import { ErrorType } from "./type.hooks";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useRestoreTrustchain } from "./useRestoreTrustchain";
import { useKeyRingClient } from "./useKeyRingClient";
import { ledgerSyncErrorForDisplay } from "../ledgerSyncErrorForDisplay";

export const useLifeCycle = () => {
  const dispatch = useDispatch();
  const sdk = useKeyRingClient();

  const { refetch: restoreTrustchain } = useRestoreTrustchain();

  function reset() {
    dispatch(resetKeyRingState());
    track("ledgersync_deactivated");
    dispatch(setFlow({ flow: Flow.Activation, step: Step.CreateOrSynchronize }));
    sdk.invalidateAuth();
  }

  const includesErrorActions: { [key: string]: () => void } = {
    [ErrorType.NO_TRUSTCHAIN]: () => reset(),
  };

  function handleError(error: Error) {
    console.error("GetMember :" + ledgerSyncErrorForDisplay(error));

    const category = classifyKeyRingError(error);
    if (category === "member-removed") reset();
    if (category === "not-allowed") reset();

    if (category === "outdated") restoreTrustchain();

    const errorToHandle = Object.entries(includesErrorActions).find(([err, _action]) =>
      error.message.includes(err),
    );

    if (errorToHandle) errorToHandle[1]();
  }

  return {
    handleError,
  };
};
