import {
  memberCredentialsSelector,
  setTrustchain,
  trustchainSelector,
} from "@ledgerhq/trustchain/store";
import { useDispatch, useSelector } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useTrustchainSdk, runWithDevice } from "./useTrustchainSdk";
import { TransportStatusError, UserRefusedOnDevice } from "@ledgerhq/errors";
import { TrustchainMember, Trustchain, MemberCredentials } from "@ledgerhq/trustchain/types";
import { useEffect, useState } from "react";

type Props = {
  device: Device | null;
  member: TrustchainMember | null;
};

export function useRemoveMembers({ device, member }: Props) {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);
  const [error, setError] = useState<Error | null>(null);

  const [userDeviceInteraction, setUserDeviceInteraction] = useState(false);

  const onRetry = () =>
    dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.DeviceActionInstance }));

  const onResetFlow = () =>
    dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.SynchronizedInstances }));

  useEffect(() => {
    if (!device) {
      onRetry();
    }
    if (!member) {
      onResetFlow();
    } else {
      removeMember(member);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeMember = async (member: TrustchainMember) => {
    try {
      await runWithDevice(device?.deviceId, async transport => {
        const newTrustchain = await sdk.removeMember(
          transport,
          trustchain as Trustchain,
          memberCredentials as MemberCredentials,
          member,
          {
            onStartRequestUserInteraction: () => setUserDeviceInteraction(true),
            onEndRequestUserInteraction: () => setUserDeviceInteraction(false),
          },
        );

        transitionToNextScreen(newTrustchain);
      });
    } catch (error) {
      setError(error as Error);
      if (!(error instanceof TransportStatusError || error instanceof UserRefusedOnDevice)) {
        dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.UnsecuredLedger }));
      }
    }
  };

  const transitionToNextScreen = (trustchainResult: Trustchain) => {
    dispatch(setTrustchain(trustchainResult));
    dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.InstanceSuccesfullyDeleted }));
  };

  return {
    error,
    onRetry,
    userDeviceInteraction,
  };
}
