import React from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { TrackScreen } from "~/analytics";
import FollowInstructions from "../../components/FollowInstructions";

import GenericErrorView from "~/components/GenericErrorView";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { ConfirmManageKey } from "../../components/ManageKey/Confirm";
import { DeletionError, ErrorReason } from "../../components/ManageInstances/DeletionError";
import { DrawerProps, SceneKind } from "../../hooks/useFollowInstructionDrawer";

type Props = DrawerProps & {
  isOpen: boolean;
  handleClose: () => void;
};

const GenericFollowInstructionsDrawer = ({
  isOpen,
  handleClose,
  scene,
  goToDelete,
  backToKeyError,
  confirmDeleteKey,
}: Props) => {
  const getScene = () => {
    switch (scene.kind) {
      case SceneKind.DeviceInstructions:
        return <FollowInstructions device={scene.device} />;

      case SceneKind.Loader:
        return (
          <Flex alignItems="center" justifyContent="center" height={150}>
            <InfiniteLoader size={50} />
          </Flex>
        );

      case SceneKind.WrongSeedError:
        return <ConfirmManageKey onClickConfirm={confirmDeleteKey} onCancel={backToKeyError} />;

      case SceneKind.KeyError:
        return (
          <DeletionError
            error={ErrorReason.UNSECURED}
            tryAgain={handleClose}
            goToDelete={goToDelete}
          />
        );

      case SceneKind.GenericError:
        return <GenericErrorView error={scene.error} withDescription withHelp hasExportLogButton />;
    }
  };

  return (
    <>
      <TrackScreen />
      <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={handleClose}>
        {getScene()}
      </QueuedDrawer>
    </>
  );
};

export default GenericFollowInstructionsDrawer;
