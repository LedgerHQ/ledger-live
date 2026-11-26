import React from "react";
import type { KeyRingMember } from "@features/platform-key-ring";
import FollowStepsOnDevice from "../DeviceActions/FollowStepsOnDevice";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { ledgerSyncErrorForDisplay } from "../../ledgerSyncErrorForDisplay";
import { useRemoveMember } from "LLD/features/WalletSync/hooks/useRemoveMember";
import { InfiniteLoader } from "@ledgerhq/react-ui";

type Props = {
  instance: KeyRingMember | null;
  device: Device | null;
};

export default function DeleteInstanceWithTrustchain({ instance, device }: Props) {
  const { error, userDeviceInteraction, onRetry } = useRemoveMember({ device, member: instance });

  if (error) {
    return (
      <ErrorDisplay error={ledgerSyncErrorForDisplay(error)} withExportLogs onRetry={onRetry} />
    );
  }
  if (userDeviceInteraction && device) {
    return <FollowStepsOnDevice modelId={device.modelId} />;
  } else {
    return <InfiniteLoader size={50} />;
  }
}
