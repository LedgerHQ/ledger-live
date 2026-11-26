import React from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { useFeature } from "@features/platform-feature-flags";
import { LedgerSyncBottomSheet } from "../Activation/LedgerSyncBottomSheet";

import GenericErrorView from "~/components/GenericErrorView";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";

import { ConfirmManageKey } from "../../components/ManageKey/Confirm";
import { HookResult } from "./useManageKeyDrawer";
import { ledgerSyncErrorForDisplay } from "@features/flow-ledger-sync";
import { classifyKeyRingError } from "@features/platform-key-ring";
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
  const isLumenSheet = useFeature("lwmLedgerSyncDie")?.enabled === true;

  const getScene = () => {
    if (deleteMutation.error) {
      const category = classifyKeyRingError(deleteMutation.error);
      if (category === "tree-not-found") {
        return <SpecificError error={ErrorReason.NO_TRUSTCHAIN} primaryAction={onCreateKey} />;
      }
      if (category === "not-member") {
        return (
          <SpecificError error={ErrorReason.UNAUTHORIZED_MEMBER} primaryAction={onCreateKey} />
        );
      }
      return (
        <GenericErrorView
          error={ledgerSyncErrorForDisplay(deleteMutation.error)}
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

  if (isLumenSheet) {
    return (
      <LedgerSyncBottomSheet
        isOpen={isDrawerVisible}
        onClose={handleClose}
        testID="wallet-sync-manage-key-sheet"
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

export default ManageKeyDrawer;
