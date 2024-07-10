import {
  memberCredentialsSelector,
  setMemberCredentials,
  setTrustchain,
} from "@ledgerhq/trustchain/store";
import { useMutation } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useTrustchainSdk, runWithDevice } from "./useTrustchainSdk";
import { TrustchainResultType } from "@ledgerhq/trustchain/types";

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
      let goNext = false;
      await runWithDevice(device?.deviceId, async transport => {
        const trustchainResult = await sdk.getOrCreateTrustchain(transport, memberCredentials, {
          onStartRequestUserInteraction: () => (goNext = false),
          onEndRequestUserInteraction: () => (goNext = true),
        });

        if (trustchainResult && goNext) {
          dispatch(setTrustchain(trustchainResult.trustchain));
          dispatch(
            setFlow({
              flow: Flow.Activation,
              step:
                trustchainResult.type === TrustchainResultType.created
                  ? Step.ActivationFinal
                  : Step.SynchronizationFinal,
            }),
          );
        }
      });
    }
  };

  const addMemberMutation = useMutation({
    mutationFn: () => addMember(),
    onError: error => {
      console.error("Error while adding member", error);
    },
  });

  return addMemberMutation;
}
