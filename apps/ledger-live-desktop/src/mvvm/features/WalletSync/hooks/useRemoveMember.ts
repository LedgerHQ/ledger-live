import { useLedgerSyncMemberRemoval } from "@features/platform-ledger-sync";
import { selectKeyRingSession, type KeyRingMember } from "@features/platform-key-ring";
import { selectIsKeyRingMember, selectHasKeyRingMemberKey } from "@domain/entity-key-ring";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useKeyRingClient } from "./useKeyRingClient";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  device: Device | null;
  member: KeyRingMember | null;
};

export function useRemoveMember({ device, member }: Props) {
  const dispatch = useDispatch();
  const sdk = useKeyRingClient();
  const session = useSelector(selectKeyRingSession);
  const isMember = useSelector(selectIsKeyRingMember);
  const hasMemberKey = useSelector(selectHasKeyRingMemberKey);
  const removeMemberWithDevice = useLedgerSyncMemberRemoval();
  const [error, setError] = useState<Error | null>(null);

  const sdkRef = useRef(sdk);
  const deviceRef = useRef(device);
  const sessionRef = useRef(session);
  const isActiveMemberRef = useRef(isMember && hasMemberKey);

  const [userDeviceInteraction, setUserDeviceInteraction] = useState(false);

  const onRetry = useCallback(
    () => dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.DeviceActionInstance })),
    [dispatch],
  );

  const onResetFlow = useCallback(
    () => dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.SynchronizedInstances })),
    [dispatch],
  );

  const removeMember = useCallback(
    async (member: KeyRingMember) => {
      const outcome = await removeMemberWithDevice({
        client: sdkRef.current,
        session: sessionRef.current,
        member,
        legacyDeviceId: deviceRef.current?.deviceId,
        callbacks: {
          onStartRequestUserInteraction: () => setUserDeviceInteraction(true),
          onEndRequestUserInteraction: () => setUserDeviceInteraction(false),
        },
        assertReady: () => {
          if (!deviceRef.current) {
            throw new Error("Device not found");
          }
          if (!isActiveMemberRef.current) {
            throw new Error("trustchain or memberCredentials is not set");
          }
        },
        onRemoved: () =>
          dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.InstanceSuccesfullyDeleted })),
      });
      if (outcome.type === "done") return;

      if (outcome.error instanceof Error) setError(outcome.error);
      if (outcome.reason === "not-allowed") {
        dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.UnsecuredLedger }));
      }
    },
    [dispatch, removeMemberWithDevice],
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
