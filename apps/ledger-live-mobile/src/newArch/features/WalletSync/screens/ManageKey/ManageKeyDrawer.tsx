import React from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";

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
  handleCancel,
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
      return <ConfirmManageKey onClickConfirm={onClickConfirm} onCancel={handleCancel} />;
    }
  };

  return (
    <QueuedDrawer isRequestingToBeOpened={isDrawerVisible} onClose={handleClose}>
      {getScene()}
    </QueuedDrawer>
  );
};

export default ManageKeyDrawer;
