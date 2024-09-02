import { memberCredentialsSelector, trustchainSelector } from "@ledgerhq/trustchain/store";
import { useSelector } from "react-redux";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { QueryKey } from "./type.hooks";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLifeCycle } from "./walletSync.hooks";
import { TrustchainNotFound } from "@ledgerhq/trustchain/errors";

export function useGetMembers() {
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);
  const { handleError } = useLifeCycle();

  function fetchMembers() {
    if (!memberCredentials) {
      return;
    }
    if (!trustchain) {
      throw new TrustchainNotFound();
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
    enabled: !!trustchain && !!memberCredentials,
  });

  useEffect(() => {
    if (isErrorGetMembers) {
      handleError(getMembersError);
    }
  }, [handleError, getMembersError, isErrorGetMembers]);

  return {
    isMembersLoading: isMembersLoading,
    instances,
    isError: isErrorGetMembers,
    error: getMembersError,
  };
}
