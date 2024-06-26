import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { setFlow } from "~/renderer/actions/walletSync";

import { DeviceModelId } from "@ledgerhq/devices";
import FollowStepsOnDevice from "../DeviceActions/FollowStepsOnDevice";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { useAddMember } from "../../hooks/useAddMember";

type Props = {
  device: Device | null;
};

export default function ActivationOrSynchroWithTrustchain({ device }: Props) {
  const dispatch = useDispatch();

  const onRetry = () => {
    dispatch(setFlow({ flow: Flow.Activation, step: Step.DeviceAction }));
  };

  const addMemberMutation = useAddMember({ device });

  useEffect(() => {
    async function addMember() {
      await addMemberMutation.mutateAsync();
    }
    addMember();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (device) {
    return addMemberMutation.isError ? (
      <ErrorDisplay error={addMemberMutation.error} withExportLogs onRetry={onRetry} />
    ) : (
      <FollowStepsOnDevice modelId={device.modelId as DeviceModelId} />
    );
  } else {
    dispatch(
      setFlow({
        flow: Flow.Activation,
        step: Step.DeviceAction,
      }),
    );
  }
}
