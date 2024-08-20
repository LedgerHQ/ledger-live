import React from "react";

import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useAddMember } from "../../hooks/useAddMember";
import GenericFollowInstructionsDrawer from "../FollowInstructions";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  device: Device | null;
};

const FollowInstructionsDrawer = ({ isOpen, handleClose, device }: Props) => {
  const { error, userDeviceInteraction } = useAddMember({ device });

  return (
    <GenericFollowInstructionsDrawer
      isOpen={isOpen}
      handleClose={handleClose}
      device={device}
      userDeviceInteraction={userDeviceInteraction}
      error={error}
    />
  );
};

export default FollowInstructionsDrawer;
