import { jwtSelector, trustchainSelector } from "@ledgerhq/trustchain/store";
import { useSelector } from "react-redux";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { QueryKey } from "./type.hooks";
import { Trustchain, JWT } from "@ledgerhq/trustchain/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLifeCycle } from "./walletSync.hooks";

export function useGetMembers() {
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const jwt = useSelector(jwtSelector);

  const errorHandler = useLifeCycle();

  const {
    isLoading: isMembersLoading,
    data: instances,
    isError: isErrorGetMembers,
    error: getMembersError,
  } = useQuery({
    queryKey: [QueryKey.getMembers, jwt, trustchain],
    queryFn: () => sdk.getMembers(jwt as JWT, trustchain as Trustchain),
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    retry: false,
  });

  useEffect(() => {
    if (isErrorGetMembers) {
      console.log("Error while fetching members", getMembersError);
      errorHandler.handleError(getMembersError);
    }
  }, [errorHandler, getMembersError, isErrorGetMembers]);

  return {
    isMembersLoading: isMembersLoading,
    instances,
    isError: isErrorGetMembers,
  };
}
