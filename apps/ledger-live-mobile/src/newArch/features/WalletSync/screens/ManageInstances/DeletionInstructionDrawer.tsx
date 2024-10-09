import React from "react";

import { Device } from "@ledgerhq/live-common/hw/actions/types";
import GenericFollowInstructionsDrawer from "../FollowInstructions";
import { TrustchainMember } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useRemoveMember } from "../../hooks/useRemoveMember";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  device: Device | null;
  member: TrustchainMember;
};

const DeletionFollowInstructionsDrawer = ({ isOpen, handleClose, device, member }: Props) => {
  return (
    <GenericFollowInstructionsDrawer
      {...useRemoveMember({ device, member })}
      isOpen={isOpen}
      handleClose={handleClose}
    />
  );
};

export default DeletionFollowInstructionsDrawer;
