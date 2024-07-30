import { useTrustchainSdk } from "./useTrustchainSdk";
import { useDispatch, useSelector } from "react-redux";
import {
  trustchainSelector,
  resetTrustchainStore,
  memberCredentialsSelector,
} from "@ledgerhq/trustchain/store";
import { useMutation } from "@tanstack/react-query";
import { QueryKey } from "./type.hooks";

export function useDestroyTrustchain() {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!trustchain || !memberCredentials) {
        return;
      }

      await sdk.destroyTrustchain(trustchain, memberCredentials);
    },
    mutationKey: [QueryKey.destroyTrustchain, trustchain],
    onSuccess: () => {
      dispatch(resetTrustchainStore());
    },
  });

  return { deleteMutation };
}
