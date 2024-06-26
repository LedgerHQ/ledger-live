import {
  trustchainSelector,
  memberCredentialsSelector,
  setJwt,
  jwtSelector,
  setTrustchain,
  resetTrustchainStore,
} from "@ledgerhq/trustchain/store";
import { Trustchain, MemberCredentials, JWT } from "@ledgerhq/trustchain/types";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { ErrorType, QueryKey } from "./type.hooks";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { TrustchainEjected } from "@ledgerhq/trustchain/errors";
import { useEffect } from "react";

export const useAuth = () => {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);

  const auth = useQuery({
    queryKey: [QueryKey.auth],
    queryFn: () => sdk.auth(trustchain as Trustchain, memberCredentials as MemberCredentials),
    enabled: false,
  });

  useEffect(() => {
    if (auth.data) {
      console.log("useAuth", auth.data);
      dispatch(setJwt(auth.data));
    }
  }, [auth.data, dispatch]);

  return auth;
};

export const useRestoreTrustchain = () => {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const memberCredentials = useSelector(memberCredentialsSelector);
  const jwt = useSelector(jwtSelector);
  const trustchain = useSelector(trustchainSelector);

  const restore = useQuery({
    enabled: false,
    queryKey: [QueryKey.restoreTrustchain],
    queryFn: () =>
      sdk.restoreTrustchain(
        jwt as JWT,
        (trustchain as Trustchain).rootId,
        memberCredentials as MemberCredentials,
      ),
  });

  useEffect(() => {
    if (restore.data) {
      console.log("useRestoreTrustchain", restore.data);
      dispatch(setTrustchain(restore.data));
    }
  }, [dispatch, restore.data]);

  return restore;
};

export const useRefreshAuth = () => {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const jwt = useSelector(jwtSelector);

  const resfresh = useQuery({
    enabled: false,
    queryKey: [QueryKey.refreshAuth, jwt],
    queryFn: () => sdk.refreshAuth(jwt as JWT),
  });

  useEffect(() => {
    if (resfresh.data) {
      console.log("useRefreshAuth", resfresh.data);
      dispatch(setJwt(resfresh.data));
    }
  }, [dispatch, resfresh.data, resfresh.isLoading]);

  return resfresh;
};

export const useLifeCycle = () => {
  const auth = useAuth();
  const refreshAuth = useRefreshAuth();
  const restoreTrustchain = useRestoreTrustchain();

  const dispatch = useDispatch();

  function reset() {
    // handle permission issue
    dispatch(resetTrustchainStore());
    dispatch(setFlow({ flow: Flow.Activation, step: Step.CreateOrSynchronize }));
  }

  const exactErrorActions: { [key: string]: () => void } = {
    [ErrorType.JWT_EXPIRED_REFRESH]: () => refreshAuth.refetch(),
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

  /**
   * 
   * 1. call some endpoint with a JWT on Trustchain API or Cloud Sync API
2. if status == 401
  2.1 if type == JWT_EXPIRED
    2.1.1 if refreshable == false => call /challenge, perform full auth, go to 1
    2.1.2 if refreshable == true => call /refresh
       2.1.2.1 if status == 200 => go to 1
       2.1.2.2 otherwise if status == 401
         2.1.2.2.1 if type == JWT_EXPIRED: edge case, JWT refresh has expired between first and second call => call /challenge, perform full auth, go to 1
         2.1.2.2.2 otherwise, there is an actual permission issue => handle it
  2.2 otherwise, there is an actual permission issue => handle it
   */
};
