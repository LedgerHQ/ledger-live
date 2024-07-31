import React from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { TrackScreen } from "~/analytics";
import FollowInstructions from "../../components/FollowInstructions";

import { Device } from "@ledgerhq/live-common/hw/actions/types";
import GenericErrorView from "~/components/GenericErrorView";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  device: Device | null;
  userDeviceInteraction: boolean;
  error: Error | null;
};

const GenericFollowInstructionsDrawer = ({
  isOpen,
  handleClose,
  device,
  error,
  userDeviceInteraction,
}: Props) => {
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

export default GenericFollowInstructionsDrawer;
