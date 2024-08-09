import {
  memberCredentialsSelector,
  trustchainSelector,
  setTrustchain,
} from "@ledgerhq/trustchain/store";
import { Trustchain, MemberCredentials } from "@ledgerhq/trustchain/types";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { QueryKey } from "./type.hooks";
import { useTrustchainSdk } from "./useTrustchainSdk";

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
