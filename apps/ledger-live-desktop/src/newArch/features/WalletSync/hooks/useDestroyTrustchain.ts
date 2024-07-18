import { useTrustchainSdk } from "./useTrustchainSdk";
import { useDispatch, useSelector } from "react-redux";
import {
  trustchainSelector,
  resetTrustchainStore,
  memberCredentialsSelector,
} from "@ledgerhq/trustchain/store";
import { useMutation } from "@tanstack/react-query";
import { MemberCredentials, Trustchain } from "@ledgerhq/trustchain/types";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { QueryKey } from "./type.hooks";

export function useDestroyTrustchain() {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);

  const deleteMutation = useMutation({
    mutationFn: () =>
      sdk.destroyTrustchain(trustchain as Trustchain, memberCredentials as MemberCredentials),
    mutationKey: [QueryKey.destroyTrustchain, trustchain],
    onSuccess: () => {
      dispatch(setFlow({ flow: Flow.ManageBackup, step: Step.BackupDeleted }));
      dispatch(resetTrustchainStore());
    },
    onError: () => dispatch(setFlow({ flow: Flow.ManageBackup, step: Step.BackupDeletionError })),
  });

  return { deleteMutation };
}
