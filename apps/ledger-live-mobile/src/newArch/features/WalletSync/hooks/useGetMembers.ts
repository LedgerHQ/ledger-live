import { memberCredentialsSelector, trustchainSelector } from "@ledgerhq/trustchain/store";
import { useSelector } from "react-redux";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "./type.hooks";
import { useLifeCycle } from "./walletSync.hooks";
import { useEffect } from "react";
import { TrustchainNotFound } from "@ledgerhq/trustchain/errors";

export function useGetMembers() {
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);

  const { handleError } = useLifeCycle();

  function getMembers() {
    if (!memberCredentials) {
      return;
    }

    if (!trustchain) {
      throw new TrustchainNotFound();
    }

    try {
      return sdk.getMembers(trustchain, memberCredentials);
    } catch (e) {
      throw e as Error;
    }
  }

  const memberHook = useQuery({
    queryKey: [QueryKey.getMembers, trustchain],
    queryFn: () => getMembers(),
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    retry: false,
    enabled: !!trustchain && !!memberCredentials,
  });

  useEffect(() => {
    if (memberHook.isError) {
      handleError(memberHook.error);
    }
  }, [handleError, memberHook.error, memberHook.isError]);

  return memberHook;
}
