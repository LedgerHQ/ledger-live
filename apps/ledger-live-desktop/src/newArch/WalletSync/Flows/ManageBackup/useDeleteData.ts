import { useLiveAuthenticate, useTrustchainSdk } from "../../useTrustchainSdk";
import { useDispatch, useSelector } from "react-redux";
import { trustchainSelector, resetTrustchainStore } from "@ledgerhq/trustchain/store";
import { useMutation } from "@tanstack/react-query";
import { JWT, Trustchain } from "@ledgerhq/trustchain/types";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";

export function useDeleteData() {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);

  const { liveJWT } = useLiveAuthenticate();

  const deleteMutation = useMutation({
    mutationFn: async () => await sdk.destroyTrustchain(trustchain as Trustchain, liveJWT as JWT),
    mutationKey: [trustchain, liveJWT],
    onSuccess: () => {
      dispatch(setFlow({ flow: Flow.ManageBackups, step: Step.BackupDeleted }));
      dispatch(resetTrustchainStore());
    },
    onError: () => dispatch(setFlow({ flow: Flow.ManageBackups, step: Step.BackupDeletionError })),
  });

  return { deleteMutation };
}
