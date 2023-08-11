// FIXME: to update when implementing edit transaction on evm

import React, { useCallback, memo } from "react";
import { AccountLike, Account, Operation } from "@ledgerhq/types-live";
import { Trans } from "react-i18next";
import Alert from "~/renderer/components/Alert";
import Link from "~/renderer/components/Link";
import { closeModal } from "~/renderer/actions/modals";
import { useDispatch } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import invariant from "invariant";

type Props = {
  operation: Operation;
  account: AccountLike;
  parentAccount?: Account;
};

const EditOperationPanel = (props: Props) => {
  const { operation, account, parentAccount } = props;
  const dispatch = useDispatch();
  const editEthTx = useFeature("editEthTx");
  const handleOpenEditModal = useCallback(() => {
    invariant(operation.transactionRaw, "operation.transactionRaw is required");
    dispatch(closeModal("MODAL_SEND"));
    // dispatch(
    //   openModal("MODAL_EDIT_TRANSACTION", {
    //     account,
    //     parentAccount,
    //     transactionRaw: operation.transactionRaw,
    //     transactionHash: operation.hash,
    //   }),
    // );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentAccount, account, operation, dispatch]);

  if (!editEthTx?.enabled) {
    return null;
  }

  return (
    <div style={{ marginBottom: "15px" }}>
      <Alert type="warning">
        <Trans i18nKey="operation.edit.panel.description" />
        <div>
          <Link
            style={{ textDecoration: "underline", fontSize: "13px" }}
            onClick={handleOpenEditModal}
          >
            <Trans i18nKey="operation.edit.panel.title" />
          </Link>
        </div>
      </Alert>
    </div>
  );
};

export default memo<Props>(EditOperationPanel);
