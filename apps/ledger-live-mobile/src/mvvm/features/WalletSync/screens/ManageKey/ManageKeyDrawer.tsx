import React from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";

import GenericErrorView from "~/components/GenericErrorView";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";

import { ConfirmManageKey } from "../../components/ManageKey/Confirm";
import { HookResult } from "./useManageKeyDrawer";
import { isNoTrustchainError, isUnauthorizedMemberError } from "../../utils/errors";
import { SpecificError } from "../../components/Error/SpecificError";
import { ErrorReason } from "../../hooks/useSpecificError";

const ManageKeyDrawer = ({
  isDrawerVisible,
  handleClose,
  deleteMutation,
  onClickConfirm,
  handleCancel,
  onCreateKey,
}: HookResult) => {
  const getScene = () => {
    if (deleteMutation.error) {
      if (isNoTrustchainError(deleteMutation.error)) {
        return <SpecificError error={ErrorReason.NO_TRUSTCHAIN} primaryAction={onCreateKey} />;
      }
      if (isUnauthorizedMemberError(deleteMutation.error)) {
        return (
          <SpecificError error={ErrorReason.UNAUTHORIZED_MEMBER} primaryAction={onCreateKey} />
        );
      }
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

    return <ConfirmManageKey onClickConfirm={onClickConfirm} onCancel={handleCancel} />;
  };

  return (
    <QueuedDrawer isRequestingToBeOpened={isDrawerVisible} onClose={handleClose}>
      {getScene()}
    </QueuedDrawer>
  );
};

export default ManageKeyDrawer;
