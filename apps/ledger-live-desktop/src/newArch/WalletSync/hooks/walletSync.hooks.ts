import {
  trustchainSelector,
  memberCredentialsSelector,
  setJwt,
  jwtSelector,
  setTrustchain,
  resetTrustchainStore,
} from "@ledgerhq/trustchain/store";
import { Trustchain, MemberCredentials, JWT } from "@ledgerhq/trustchain/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { ErrorType, QueryKey } from "./type.hooks";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { TrustchainEjected } from "@ledgerhq/trustchain/errors";

export const useAuth = () => {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);

  async function authFn() {
    const newJwt = await sdk.auth(trustchain as Trustchain, memberCredentials as MemberCredentials);
    dispatch(setJwt(newJwt));
    return newJwt;
  }
  const auth = useQuery({
    queryKey: [QueryKey.auth],
    queryFn: authFn,
    enabled: false,
  });

  return auth;
};

export const useRestoreTrustchain = () => {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const memberCredentials = useSelector(memberCredentialsSelector);
  const jwt = useSelector(jwtSelector);
  const trustchain = useSelector(trustchainSelector);

  async function restoreTrustchain() {
    const newTrustchain = await sdk.restoreTrustchain(
      jwt as JWT,
      (trustchain as Trustchain).rootId,
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

export const useRefreshAuth = () => {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const jwt = useSelector(jwtSelector);

  async function refresh() {
    const newJwt = await sdk.refreshAuth(jwt as JWT);
    dispatch(setJwt(newJwt));
    return newJwt;
  }

  const resfresh = useQuery({
    enabled: false,
    queryKey: [QueryKey.refreshAuth, jwt],
    queryFn: refresh,
  });

  return resfresh;
};

export const useLifeCycle = () => {
  const queryClient = useQueryClient();
  const auth = useAuth();
  const refreshAuth = useRefreshAuth();
  const restoreTrustchain = useRestoreTrustchain();

  const dispatch = useDispatch();

  function reset() {
    dispatch(resetTrustchainStore());
    dispatch(setFlow({ flow: Flow.Activation, step: Step.CreateOrSynchronize }));
  }

  const exactErrorActions: { [key: string]: () => void } = {
    [ErrorType.JWT_EXPIRED_REFRESH]: () => {
      refreshAuth.refetch().then(() => {
        queryClient.invalidateQueries({ queryKey: [QueryKey.getMembers] });
      });
    },
    [ErrorType.JWT_EXPIRED_CHALLENGE]: () => auth.refetch(),
  };

  const includesErrorActions: { [key: string]: () => void } = {
    [ErrorType.NOT_MEMBER]: () => {
      console.log("NOT_MEMBER");
    },
    [ErrorType.NO_PERMISSION]: () => {
      console.log("NO_PERMISSION");
      auth.refetch();
    },

    [ErrorType.NO_PERMISSION_FOR_TRUSTCHAIN]: () => {
      restoreTrustchain.refetch();
    },
    [ErrorType.NO_TRUSTCHAIN]: () => {
      reset();
    },
  };

  function handleError(error: Error) {
    if (exactErrorActions[error.message]) {
      exactErrorActions[error.message]();
      return;
    }

    for (const key in includesErrorActions) {
      if (error.message.includes(key)) {
        includesErrorActions[key]();
        return;
      }
    }

    if (error instanceof TrustchainEjected) {
      reset();
    }
  }

  return {
    handleError,
    isLoading: false,
    error: auth.error || refreshAuth.error,
    isError: !!auth.error || !!refreshAuth.error,
  };
};
