import {
  memberCredentialsSelector,
  setJwt,
  setTrustchain,
  trustchainSelector,
} from "@ledgerhq/trustchain/store";
import { useMutation } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useTrustchainSdk, runWithDevice } from "./useTrustchainSdk";
import { QueryKey } from "./type.hooks";
import { TransportStatusError, UserRefusedOnDevice } from "@ledgerhq/errors";
import { TrustchainMember, Trustchain, MemberCredentials } from "@ledgerhq/trustchain/types";

export function useRemoveMembers({ device }: { device: Device | null }) {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);

  const removeMember = async (member: TrustchainMember) => {
    if (!device) {
      dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.DeviceActionInstance }));
    }
    await runWithDevice(device?.deviceId, async transport => {
      const seedIdToken = await sdk.authWithDevice(transport);

      const { trustchain: newTrustchain } = await sdk.removeMember(
        transport,
        seedIdToken,
        trustchain as Trustchain,
        memberCredentials as MemberCredentials,
        member,
      );

      if (newTrustchain) {
        dispatch(setJwt(seedIdToken));
        dispatch(setTrustchain(newTrustchain));
        dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.InstanceSuccesfullyDeleted }));
      }
    });
  };

  const removeMemberMutation = useMutation({
    mutationFn: (member: TrustchainMember) => removeMember(member),
    mutationKey: [QueryKey.deleteMember],
    onError: error => {
      console.error("Error while removing member", error);

      if (!(error instanceof TransportStatusError || error instanceof UserRefusedOnDevice)) {
        dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.UnsecuredLedger }));
      }
    },
  });

  return removeMemberMutation;
}
