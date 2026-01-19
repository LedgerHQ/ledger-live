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
  return (
    <GenericFollowInstructionsDrawer
      {...useAddMember({ device })}
      isOpen={isOpen}
      handleClose={handleClose}
    />
  );
};

export default FollowInstructionsDrawer;
