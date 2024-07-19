import React from "react";
import { TrustchainMember } from "@ledgerhq/trustchain/types";
import FollowStepsOnDevice from "../DeviceActions/FollowStepsOnDevice";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { useRemoveMembers } from "../../hooks/useRemoveMember";
import { InfiniteLoader } from "@ledgerhq/react-ui";

type Props = {
  instance: TrustchainMember | null;
  device: Device | null;
};

export default function DeleteInstanceWithTrustchain({ instance, device }: Props) {
  const { error, userDeviceInteraction, onRetry } = useRemoveMembers({ device, member: instance });

  if (error) {
    return <ErrorDisplay error={error} withExportLogs onRetry={onRetry} />;
  }
  if (userDeviceInteraction && device) {
    return <FollowStepsOnDevice modelId={device.modelId} />;
  } else {
    return <InfiniteLoader size={50} />;
  }
}
