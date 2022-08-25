import React, { useEffect, useState } from "react";
import { Box } from "@ledgerhq/react-ui";

import SoftwareCheckContent from "./SoftwareCheckContent";
import GenuineCheckModal from "./GenuineCheckModal";

export enum SoftwareCheckStatus {
  inactive = "inactive",
  requested = "requested",
  updateAvailable = "updateAvailable",
  cancelled = "cancelled",
  active = "active",
  completed = "completed",
  failed = "failed",
}

const UIDelay = 2500;

export type Props = {
  isDisplayed?: boolean;
  onComplete: () => void;
};

const SoftwareCheckStep = ({ isDisplayed, onComplete }: Props) => {
  const [genuineCheckStatus, setGenuineCheckStatus] = useState<SoftwareCheckStatus>(
    SoftwareCheckStatus.inactive,
  );
  const [firmwareUpdateStatus, setFirmwareUpdateStatus] = useState<SoftwareCheckStatus>(
    SoftwareCheckStatus.inactive,
  );

  useEffect(() => {
    if (!isDisplayed) {
      return;
    }

    if (genuineCheckStatus === SoftwareCheckStatus.inactive) {
      setTimeout(() => setGenuineCheckStatus(SoftwareCheckStatus.requested), UIDelay);
    }

    if (
      genuineCheckStatus === SoftwareCheckStatus.active ||
      genuineCheckStatus === SoftwareCheckStatus.cancelled
    ) {
      // TODO: plug genuine check flow
      setGenuineCheckStatus(SoftwareCheckStatus.completed);
    }

    if (
      genuineCheckStatus === SoftwareCheckStatus.failed ||
      genuineCheckStatus === SoftwareCheckStatus.completed
    ) {
      setTimeout(() => setFirmwareUpdateStatus(SoftwareCheckStatus.requested), UIDelay);
    }
  }, [isDisplayed, genuineCheckStatus]);

  useEffect(() => {
    if (!isDisplayed) {
      return;
    }

    if (firmwareUpdateStatus === SoftwareCheckStatus.requested) {
      // TODO: plug firmware update flow
      setFirmwareUpdateStatus(SoftwareCheckStatus.completed);
    }

    if (
      firmwareUpdateStatus === SoftwareCheckStatus.failed ||
      firmwareUpdateStatus === SoftwareCheckStatus.completed
    ) {
      setTimeout(onComplete, UIDelay);
    }
  }, [isDisplayed, firmwareUpdateStatus, onComplete]);

  return (
    <Box>
      <GenuineCheckModal
        isOpen={genuineCheckStatus === "requested"}
        onClose={() => setGenuineCheckStatus(SoftwareCheckStatus.active)}
      />
      <SoftwareCheckContent
        genuineCheckStatus={genuineCheckStatus}
        firmwareUpdateStatus={firmwareUpdateStatus}
      />
    </Box>
  );
};

export default SoftwareCheckStep;
