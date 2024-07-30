import React from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { TrackScreen } from "~/analytics";

import GenericErrorView from "~/components/GenericErrorView";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { ListInstances } from "../../components/ManageInstances/ListInstances";
import { DeletionError, ErrorReason } from "../../components/ManageInstances/DeletionError";
import DeviceActionForInstance from "./DeviceActionForInstance";
import { HookResult, Scene } from "./useManageInstanceDrawer";

const ManageInstancesDrawer = ({
  isDrawerVisible,
  handleClose,
  memberCredentials,
  onClickInstance,
  memberHook,
  scene,
  onClickDelete,
  changeScene,
}: HookResult) => {
  const { error, isError, isLoading, data } = memberHook;

  const getScene = () => {
    if (isError) {
      return <GenericErrorView error={error} withDescription withHelp hasExportLogButton />;
    }

    if (isLoading) {
      return (
        <Flex alignItems="center" justifyContent="center" height={150}>
          <InfiniteLoader size={50} />
        </Flex>
      );
    }
    if (scene === Scene.List) {
      return (
        <ListInstances
          onClickDelete={onClickDelete}
          members={data}
          currentInstance={memberCredentials?.pubkey}
        />
      );
    }

    if (scene === Scene.AutoRemove) {
      return (
        <DeletionError
          error={ErrorReason.AUTO_REMOVE}
          // eslint-disable-next-line no-console
          goToDelete={() => console.log("gotoDelete")}
          understood={() => changeScene(Scene.List)}
        />
      );
    }

    if (scene === Scene.DeviceAction) {
      return <DeviceActionForInstance goToFollowInstructions={onClickInstance} />;
    }
    if (scene === Scene.Instructions) {
      return null;
    }
  };

  return (
    <>
      <TrackScreen />
      <QueuedDrawer isRequestingToBeOpened={isDrawerVisible} onClose={handleClose}>
        {getScene()}
      </QueuedDrawer>
    </>
  );
};

export default ManageInstancesDrawer;
