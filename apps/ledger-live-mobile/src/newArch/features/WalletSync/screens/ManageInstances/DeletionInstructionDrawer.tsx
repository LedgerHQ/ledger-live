import React from "react";

import { Device } from "@ledgerhq/live-common/hw/actions/types";
import GenericFollowInstructionsDrawer from "../FollowInstructions";
import { TrustchainMember } from "@ledgerhq/trustchain/types";
import { useRemoveMember } from "../../hooks/useRemoveMember";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  device: Device | null;
  member: TrustchainMember;
};

const DeletionFollowInstructionsDrawer = ({ isOpen, handleClose, device, member }: Props) => {
  const { error, userDeviceInteraction, goToDelete } = useRemoveMember({ device, member });

  return (
    <GenericFollowInstructionsDrawer
      isOpen={isOpen}
      handleClose={handleClose}
      device={device}
      userDeviceInteraction={userDeviceInteraction}
      error={error}
      goToDelete={goToDelete}
    />
  );
};

export default DeletionFollowInstructionsDrawer;
