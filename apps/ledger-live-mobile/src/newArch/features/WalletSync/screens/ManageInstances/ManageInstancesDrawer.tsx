import React, { useCallback } from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { TrackScreen } from "~/analytics";

import GenericErrorView from "~/components/GenericErrorView";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { ListInstances } from "../../components/ManageInstances/ListInstances";
import { DeletionError } from "../../components/ManageInstances/DeletionError";

import { HookResult, Scene } from "./useManageInstanceDrawer";
import { useManageKeyDrawer } from "../ManageKey/useManageKeyDrawer";
import { ErrorReason } from "../../hooks/useSpecificError";

const ManageInstancesDrawer = ({
  isDrawerVisible,
  handleClose,
  memberCredentials,
  memberHook,
  scene,
  changeScene,
  onClickInstance,
}: HookResult) => {
  const { error, isError, isLoading, data } = memberHook;
  const manageKeyHook = useManageKeyDrawer();

  const goToManageBackup = useCallback(() => {
    handleClose();
    manageKeyHook.openDrawer();
  }, [manageKeyHook, handleClose]);

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
          changeScene={changeScene}
          onClickInstance={onClickInstance}
          members={data}
          currentInstance={memberCredentials?.pubkey}
        />
      );
    }

    if (scene === Scene.AutoRemove) {
      return (
        <DeletionError
          error={ErrorReason.AUTO_REMOVE}
          primaryAction={() => changeScene(Scene.List)}
          secondaryAction={goToManageBackup}
        />
      );
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
