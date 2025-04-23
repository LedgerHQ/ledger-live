import React from "react";

import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useAddMember } from "../../hooks/useAddMember";
import GenericFollowInstructionsDrawer from "../FollowInstructions";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  device: Device | null;
  name: string;
};

const FollowInstructionsDrawer = ({ isOpen, handleClose, device, name }: Props) => {
  return (
    <GenericFollowInstructionsDrawer
      {...useAddMember({ device, name })}
      isOpen={isOpen}
      handleClose={handleClose}
    />
  );
};

export default FollowInstructionsDrawer;
