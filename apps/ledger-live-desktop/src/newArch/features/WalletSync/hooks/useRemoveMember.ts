import {
  memberCredentialsSelector,
  setTrustchain,
  trustchainSelector,
} from "@ledgerhq/trustchain/store";
import { useDispatch, useSelector } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useTrustchainSdk, runWithDevice } from "./useTrustchainSdk";
import { TrustchainMember, Trustchain, MemberCredentials } from "@ledgerhq/trustchain/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { TrustchainNotAllowed } from "@ledgerhq/trustchain/errors";

type Props = {
  device: Device | null;
  member: TrustchainMember | null;
};

export function useRemoveMember({ device, member }: Props) {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);
  const [error, setError] = useState<Error | null>(null);

  const sdkRef = useRef(sdk);
  const deviceRef = useRef(device);
  const memberCredentialsRef = useRef(memberCredentials);
  const trustchainRef = useRef(trustchain);

  const [userDeviceInteraction, setUserDeviceInteraction] = useState(false);

  const onRetry = useCallback(
    () => dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.DeviceActionInstance })),
    [dispatch],
  );

  const onResetFlow = useCallback(
    () => dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.SynchronizedInstances })),
    [dispatch],
  );

  const transitionToNextScreen = useCallback(
    (trustchainResult: Trustchain) => {
      dispatch(setTrustchain(trustchainResult));
      dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.InstanceSuccesfullyDeleted }));
    },
    [dispatch],
  );

  const removeMember = useCallback(
    async (member: TrustchainMember) => {
      try {
        await runWithDevice(deviceRef.current?.deviceId, async transport => {
          const newTrustchain = await sdkRef.current.removeMember(
            transport,
            trustchainRef.current as Trustchain,
            memberCredentialsRef.current as MemberCredentials,
            member,
            {
              onStartRequestUserInteraction: () => setUserDeviceInteraction(true),
              onEndRequestUserInteraction: () => setUserDeviceInteraction(false),
            },
          );

          transitionToNextScreen(newTrustchain);
        });
      } catch (error) {
        if (error instanceof Error) setError(error);
        if (error instanceof TrustchainNotAllowed) {
          dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.UnsecuredLedger }));
        }
      }
    },
    [dispatch, transitionToNextScreen],
  );

  useEffect(() => {
    if (!deviceRef.current) {
      onRetry();
    }
    if (!member) {
      onResetFlow();
    } else {
      removeMember(member);
    }
  }, [member, onResetFlow, onRetry, removeMember]);

  return {
    error,
    onRetry,
    userDeviceInteraction,
  };
}
