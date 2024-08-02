import React from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { TrackScreen } from "~/analytics";

import GenericErrorView from "~/components/GenericErrorView";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";

import { ManageKey } from "../../components/ManageKey/ManageKey";
import { ConfirmManageKey } from "../../components/ManageKey/Confirm";
import { HookResult, Scene } from "./useManageKeyDrawer";

const ManageKeyDrawer = ({
  isDrawerVisible,
  handleClose,
  deleteMutation,
  scene,
  onClickDelete,
  onClickConfirm,
}: HookResult) => {
  const getScene = () => {
    if (deleteMutation.error) {
      return (
        <GenericErrorView
          error={deleteMutation.error}
          withDescription
          withHelp
          hasExportLogButton
        />
      );
    }

    if (deleteMutation.isPending) {
      return (
        <Flex alignItems="center" justifyContent="center" height={150}>
          <InfiniteLoader size={50} />
        </Flex>
      );
    }
    if (scene === Scene.Manage) {
      return <ManageKey onClickDelete={onClickDelete} />;
    }
    if (scene === Scene.Confirm) {
      return <ConfirmManageKey onClickConfirm={onClickConfirm} onCancel={handleClose} />;
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

export default ManageKeyDrawer;
