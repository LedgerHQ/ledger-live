import React, { useCallback } from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { useFeature } from "@features/platform-feature-flags";
import { LedgerSyncBottomSheet } from "../Activation/LedgerSyncBottomSheet";

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

  const isLumenSheet = useFeature("lwmLedgerSyncDie")?.enabled === true;

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

  if (isLumenSheet) {
    return (
      <LedgerSyncBottomSheet
        isOpen={isDrawerVisible}
        onClose={handleClose}
        testID="wallet-sync-manage-instances-sheet"
      >
        {getScene()}
      </LedgerSyncBottomSheet>
    );
  }

  return (
    <QueuedDrawer isRequestingToBeOpened={isDrawerVisible} onClose={handleClose}>
      {getScene()}
    </QueuedDrawer>
  );
};

export default ManageInstancesDrawer;
