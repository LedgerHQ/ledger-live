import React from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

import FollowStepsOnDevice from "../DeviceActions/FollowStepsOnDevice";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { useAddMember } from "../../hooks/useAddMember";
import { InfiniteLoader } from "@ledgerhq/react-ui";

type Props = {
  device: Device | null;
};

export default function ActivationOrSynchroWithTrustchain({ device }: Props) {
  const { error, userDeviceInteraction, handleMissingDevice, onRetry } = useAddMember({ device });

  if (!device) {
    handleMissingDevice();
  }

  if (error) {
    return <ErrorDisplay error={error} withExportLogs onRetry={onRetry} />;
  }

  if (userDeviceInteraction && device) {
    <FollowStepsOnDevice modelId={device.modelId} />;
  } else {
    return <InfiniteLoader size={50} />;
  }
}
