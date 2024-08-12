import { memberCredentialsSelector, trustchainSelector } from "@ledgerhq/trustchain/store";
import { useSelector } from "react-redux";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { QueryKey } from "./type.hooks";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLifeCycle } from "./walletSync.hooks";

export function useGetMembers() {
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);
  const errorHandler = useLifeCycle();

  function fetchMembers() {
    if (!trustchain || !memberCredentials) {
      throw new Error("Trustchain or MemberCredentials is falsy");
    }

    return sdk.getMembers(trustchain, memberCredentials);
  }

  const {
    isLoading: isMembersLoading,
    data: instances,
    isError: isErrorGetMembers,
    error: getMembersError,
  } = useQuery({
    queryKey: [QueryKey.getMembers, trustchain],
    queryFn: () => fetchMembers(),
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    retry: false,
  });

  useEffect(() => {
    if (isErrorGetMembers) {
      errorHandler.handleError(getMembersError);
    }
  }, [errorHandler, getMembersError, isErrorGetMembers]);

  return {
    isMembersLoading: isMembersLoading,
    instances,
    isError: isErrorGetMembers,
    error: getMembersError,
  };
}
