import React from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { TrackScreen } from "~/analytics";
import FollowInstructions from "../../components/FollowInstructions";

import { Device } from "@ledgerhq/live-common/hw/actions/types";
import GenericErrorView from "~/components/GenericErrorView";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { useAddMember } from "../../hooks/useAddMember";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  device: Device | null;
};

const FollowInstructionsDrawer = ({ isOpen, handleClose, device }: Props) => {
  const { error, userDeviceInteraction } = useAddMember({ device });

  return (
    <>
      <TrackScreen />
      <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={handleClose}>
        {error ? (
          <GenericErrorView error={error} withDescription withHelp hasExportLogButton />
        ) : userDeviceInteraction && device ? (
          <FollowInstructions device={device} />
        ) : (
          <Flex alignItems="center" justifyContent="center" height={150}>
            <InfiniteLoader size={50} />
          </Flex>
        )}
      </QueuedDrawer>
    </>
  );
};

export default FollowInstructionsDrawer;
