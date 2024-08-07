import React from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { TrackScreen } from "~/analytics";
import FollowInstructions from "../../components/FollowInstructions";

import { Device } from "@ledgerhq/live-common/hw/actions/types";
import GenericErrorView from "~/components/GenericErrorView";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { TrustchainNotAllowed } from "@ledgerhq/trustchain/errors";
import { DeletionError, ErrorReason } from "../../components/ManageInstances/DeletionError";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  device: Device | null;
  userDeviceInteraction: boolean;
  error: Error | null;
  goToDelete?: () => void;
};

const GenericFollowInstructionsDrawer = ({
  isOpen,
  handleClose,
  device,
  error,
  userDeviceInteraction,
  goToDelete,
}: Props) => {
  return (
    <>
      <TrackScreen />
      <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={handleClose}>
        {error ? (
          error instanceof TrustchainNotAllowed ? (
            <DeletionError
              error={ErrorReason.UNSECURED}
              tryAgain={handleClose}
              goToDelete={goToDelete}
            />
          ) : (
            <GenericErrorView error={error} withDescription withHelp hasExportLogButton />
          )
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
