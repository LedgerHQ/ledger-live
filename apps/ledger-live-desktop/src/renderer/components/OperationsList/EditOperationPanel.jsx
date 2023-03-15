// @flow

import React, { useCallback } from "react";
import type { AccountLike, Account, Operation } from "@ledgerhq/types-live";
import { Trans } from "react-i18next";
import Alert from "~/renderer/components/Alert";
import Link from "~/renderer/components/Link";
import { openModal } from "~/renderer/actions/modals";
import { useDispatch } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

type Props = {
  operation: Operation,
  account: AccountLike,
  parentAccount?: Account,
};

const EditOperationPanel: React$ComponentType<Props> = (props: Props) => {
  const { operation, account, parentAccount } = props;
  const dispatch = useDispatch();
  const editEthTx = useFeature("editEthTx");
  if (!editEthTx?.enabled) {
    return null;
  }
  const handleOpenEditModal = useCallback(
    (account, parentAccount, transactionRaw, transactionSequenceNumber, isNftOperation) => {
      dispatch(
        openModal("MODAL_EDIT_TRANSACTION", {
          account,
          parentAccount,
          transactionRaw,
          transactionSequenceNumber,
          isNftOperation,
        }),
      );
    },
    [dispatch],
  );
  return (
    <Alert type="warning" style={{ marginBottom: "40px" }}>
      <Trans i18nKey="operation.edit.panel.description" />
      <div>
        <Link
          style={{ textDecoration: "underline", fontSize: "13px" }}
          onClick={() => {
            handleOpenEditModal(
              account,
              parentAccount,
              operation.transactionRaw,
              operation.transactionSequenceNumber,
              operation.type === "NFT_OUT",
            );
          }}
        >
          <Trans i18nKey="operation.edit.panel.title" />
        </Link>
      </div>
    </Alert>
  );
};

export default EditOperationPanel;
