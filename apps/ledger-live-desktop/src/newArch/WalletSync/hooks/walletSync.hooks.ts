import {
  trustchainSelector,
  memberCredentialsSelector,
  setTrustchain,
  resetTrustchainStore,
} from "@ledgerhq/trustchain/store";
import { Trustchain, MemberCredentials } from "@ledgerhq/trustchain/types";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { ErrorType, QueryKey } from "./type.hooks";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { TrustchainEjected } from "@ledgerhq/trustchain/errors";

export const useRestoreTrustchain = () => {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const memberCredentials = useSelector(memberCredentialsSelector);

  const trustchain = useSelector(trustchainSelector);

  async function restoreTrustchain() {
    const newTrustchain = await sdk.restoreTrustchain(
      trustchain as Trustchain,
      memberCredentials as MemberCredentials,
    );

    dispatch(setTrustchain(newTrustchain));

    return newTrustchain;
  }

  const restore = useQuery({
    enabled: false,
    queryKey: [QueryKey.restoreTrustchain],
    queryFn: restoreTrustchain,
  });

  return restore;
};

export const useLifeCycle = () => {
  const restoreTrustchain = useRestoreTrustchain();

  const dispatch = useDispatch();

  function reset() {
    dispatch(resetTrustchainStore());
    dispatch(setFlow({ flow: Flow.Activation, step: Step.CreateOrSynchronize }));
  }

  const includesErrorActions: { [key: string]: () => void } = {
    [ErrorType.NOT_MEMBER]: () => reset(),
    [ErrorType.NO_PERMISSION]: () => reset(),
    [ErrorType.NO_PERMISSION_FOR_TRUSTCHAIN]: () => restoreTrustchain.refetch(),
    [ErrorType.NO_TRUSTCHAIN]: () => reset(),
  };

  function handleError(error: Error) {
    console.error("GetMember : " + error);
    if (error instanceof TrustchainEjected) {
      reset();
    }
    const errorToHandle = Object.entries(includesErrorActions).find(([err, _action]) =>
      error.message.includes(err),
    );

    if (errorToHandle) errorToHandle[1]();
  }

  return {
    handleError,
  };
};
