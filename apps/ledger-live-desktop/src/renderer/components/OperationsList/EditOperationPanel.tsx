import React, { useCallback, memo } from "react";
import { AccountLike, Account, Operation } from "@ledgerhq/types-live";
import { Trans } from "react-i18next";
import Alert from "~/renderer/components/Alert";
import Link from "~/renderer/components/Link";
import { openModal } from "~/renderer/actions/modals";
import { useDispatch } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

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
    dispatch(
      openModal("MODAL_EDIT_TRANSACTION", {
        account,
        parentAccount,
        transactionRaw: operation.transactionRaw,
        transactionSequenceNumber: operation.transactionSequenceNumber,
        isNftOperation: operation.type === "NFT_OUT",
      }),
    );
  }, [parentAccount, account, operation, dispatch]);
  if (!editEthTx?.enabled) {
    return null;
  }
  return (
    <Alert type="warning" style={{ marginBottom: "40px" }}>
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
  );
};

export default memo<Props>(EditOperationPanel);
