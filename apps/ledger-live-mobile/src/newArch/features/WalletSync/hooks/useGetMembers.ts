import { memberCredentialsSelector, trustchainSelector } from "@ledgerhq/trustchain/store";
import { useSelector } from "react-redux";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { Trustchain, MemberCredentials } from "@ledgerhq/trustchain/types";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "./type.hooks";

export function useGetMembers() {
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);

  return useQuery({
    queryKey: [QueryKey.getMembers, trustchain],
    queryFn: () => sdk.getMembers(trustchain as Trustchain, memberCredentials as MemberCredentials),
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    retry: false,
  });
}
