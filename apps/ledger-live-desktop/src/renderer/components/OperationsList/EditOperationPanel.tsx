import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import invariant from "invariant";
import React, { memo, useCallback } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import { closeModal, openModal } from "~/renderer/actions/modals";
import Alert from "~/renderer/components/Alert";
import Link from "~/renderer/components/Link";

type Props = {
  operation: Operation;
  account: AccountLike;
  parentAccount?: Account;
};

const EditOperationPanel = (props: Props) => {
  const { operation, account, parentAccount } = props;
  const dispatch = useDispatch();
  const { enabled: isEditEvmTxEnabled, params } = useFeature("editEvmTx") ?? {};
  const mainAccount = getMainAccount(account, parentAccount);
  const isCurrencySupported =
    params?.supportedCurrencyIds?.includes(mainAccount.currency.id as CryptoCurrencyId) || false;

  const handleOpenEditModal = useCallback(() => {
    invariant(operation.transactionRaw, "operation.transactionRaw is required");
    dispatch(closeModal("MODAL_SEND"));
    dispatch(
      openModal("MODAL_EVM_EDIT_TRANSACTION", {
        account,
        parentAccount,
        transactionRaw: operation.transactionRaw,
        transactionHash: operation.hash,
      }),
    );
  }, [parentAccount, account, operation, dispatch]);

  if (!isEditEvmTxEnabled || !isCurrencySupported) {
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
