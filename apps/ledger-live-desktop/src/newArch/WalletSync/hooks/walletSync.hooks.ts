import { resetTrustchainStore } from "@ledgerhq/trustchain/store";
import { useDispatch } from "react-redux";
import { ErrorType } from "./type.hooks";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { TrustchainEjected, TrustchainNotAllowed } from "@ledgerhq/trustchain/errors";

export const useLifeCycle = () => {
  const dispatch = useDispatch();

  function reset() {
    dispatch(resetTrustchainStore());
    dispatch(setFlow({ flow: Flow.Activation, step: Step.CreateOrSynchronize }));
  }

  const includesErrorActions: { [key: string]: () => void } = {
    [ErrorType.NO_TRUSTCHAIN]: () => reset(),
  };

  function handleError(error: Error) {
    console.error("GetMember :" + error);

    if (error instanceof TrustchainEjected) reset();
    if (error instanceof TrustchainNotAllowed) reset();

    const errorToHandle = Object.entries(includesErrorActions).find(([err, _action]) =>
      error.message.includes(err),
    );

    if (errorToHandle) errorToHandle[1]();
  }

  return {
    handleError,
  };
};
