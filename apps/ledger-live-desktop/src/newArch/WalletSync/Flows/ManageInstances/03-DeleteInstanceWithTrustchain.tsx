import React, { useEffect } from "react";
import { TrustchainMember } from "@ledgerhq/trustchain/types";
import FollowStepsOnDevice from "../DeviceActions/FollowStepsOnDevice";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { useDispatch, useSelector } from "react-redux";
import { lastSeenDeviceSelector } from "~/renderer/reducers/settings";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useRemoveMembers } from "../../hooks/useRemoveMember";

type Props = {
  instance: TrustchainMember | null;
  device: Device | null;
};

export default function DeleteInstanceWithTrustchain({ instance, device }: Props) {
  const dispatch = useDispatch();
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);

  const removeMemberMutation = useRemoveMembers({ device });

  const onRetry = () =>
    dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.DeviceActionInstance }));

  useEffect(() => {
    async function removeMember(instance: TrustchainMember) {
      await removeMemberMutation.mutateAsync(instance);
    }
    if (instance) removeMember(instance);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return removeMemberMutation.isError ? (
    <ErrorDisplay error={removeMemberMutation.error} withExportLogs onRetry={onRetry} />
  ) : (
    <FollowStepsOnDevice modelId={lastSeenDevice?.modelId as DeviceModelId} />
  );
}
