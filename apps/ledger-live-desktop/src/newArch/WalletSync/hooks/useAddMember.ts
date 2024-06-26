import {
  memberCredentialsSelector,
  setJwt,
  setMemberCredentials,
  setTrustchain,
} from "@ledgerhq/trustchain/store";
import { useMutation } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useTrustchainSdk, runWithDevice } from "./useTrustchainSdk";
import { QueryKey } from "./type.hooks";

export function useAddMember({ device }: { device: Device | null }) {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const memberCredentials = useSelector(memberCredentialsSelector);

  const addMember = async () => {
    if (!device) {
      dispatch(setFlow({ flow: Flow.Activation, step: Step.DeviceAction }));
    }
    if (!memberCredentials) {
      const newMemberCredentials = await sdk.initMemberCredentials();
      dispatch(setMemberCredentials(newMemberCredentials));
    } else {
      await runWithDevice(device?.deviceId, async transport => {
        const seedIdToken = await sdk.authWithDevice(transport);

        const { trustchain, hasCreatedTrustchain } = await sdk.getOrCreateTrustchain(
          transport,
          seedIdToken,
          memberCredentials,
        );

        if (trustchain) {
          dispatch(setJwt(seedIdToken));
          dispatch(setTrustchain(trustchain));

          dispatch(
            setFlow({
              flow: Flow.Activation,
              step: hasCreatedTrustchain ? Step.ActivationFinal : Step.SynchronizationFinal,
            }),
          );
        }
      });
    }
  };

  const addMemberMutation = useMutation({
    mutationFn: () => addMember(),
    mutationKey: [QueryKey.addMember],
    onError: error => {
      console.error("Error while adding member", error);
    },
  });

  return addMemberMutation;
}
