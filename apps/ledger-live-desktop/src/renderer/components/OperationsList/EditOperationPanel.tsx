import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import invariant from "invariant";
import React, { memo, useCallback, useMemo } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { closeModal, openModal } from "~/renderer/actions/modals";
import Alert from "~/renderer/components/Alert";
import Link from "~/renderer/components/Link";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";

type Props = {
  operation: Operation;
  account: AccountLike;
  parentAccount?: Account;
};

const EditOperationPanel = (props: Props) => {
  const { operation, account, parentAccount } = props;
  const dispatch = useDispatch();
  const { enabled: isEditEvmTxEnabled, params } = useFeature("editEvmTx") ?? {};
  const { enabled: isEditBitcoinTxEnabled, params: bitcoinParams } =
    useFeature("editBitcoinTx") ?? {};
  const mainAccount = getMainAccount(account, parentAccount);
  const currencyFamily = mainAccount.currency.family;

  // Determine if transaction editing is supported and which modal to use
  const editConfig = useMemo(() => {
    // Check for Bitcoin RBF support
    if (currencyFamily === "bitcoin") {
      // RBF only works for unconfirmed (pending) transactions
      const isPending = !operation.blockHeight;

      if (!isPending) {
        return null;
      }

      // For Bitcoin RBF, we can edit pending transactions even without transactionRaw
      // The edit modal will fetch the transaction from the blockchain using the hash
      // If transactionRaw exists, check if RBF is explicitly disabled
      console.log("Checking Bitcoin RBF support for operation:", operation);
      if (operation.transactionRaw) {
        const bitcoinTxRaw = operation.transactionRaw as {
          family?: string;
          rbf?: boolean;
          replaceTxId?: string;
        };

        // RBF is supported if rbf is not explicitly false
        const isRbfDisabled = bitcoinTxRaw.rbf === false;

        if (isRbfDisabled) {
          return null;
        }
      }

      if (
        isEditBitcoinTxEnabled &&
        bitcoinParams?.supportedCurrencyIds?.includes(mainAccount.currency.id as CryptoCurrencyId)
      ) {
        return {
          modalName: "MODAL_BITCOIN_EDIT_TRANSACTION" as const,
          isSupported: true,
        };
      }
      return null;
    }

    // For EVM, transactionRaw is required
    if (!operation.transactionRaw) {
      return null;
    }

    // Check for EVM support
    if (currencyFamily === "evm") {
      const isCurrencySupported =
        params?.supportedCurrencyIds?.includes(mainAccount.currency.id) || false;

      if (isEditEvmTxEnabled && isCurrencySupported) {
        return {
          modalName: "MODAL_EVM_EDIT_TRANSACTION" as const,
          isSupported: true,
        };
      }
      return null;
    }

    return null;
  }, [
    operation.transactionRaw,
    operation.blockHeight,
    currencyFamily,
    isEditEvmTxEnabled,
    params,
    mainAccount.currency.id,
    isEditBitcoinTxEnabled,
    bitcoinParams,
  ]);

  const handleOpenEditModal = useCallback(() => {
    if (!editConfig) {
      return;
    }

    dispatch(closeModal("MODAL_SEND"));

    // For Bitcoin, we can edit even without transactionRaw (the modal will fetch it)
    // For EVM, transactionRaw is required
    if (currencyFamily === "bitcoin") {
      // replaceTxId must always be the tx we are replacing (this operation's hash).
      // When re-canceling a cancel, the conflicting tx is the cancel, not the original send,
      // so we must beat the cancel's fee — never use a stored replaceTxId from a previous replacement.
      const transactionRaw =
        operation.transactionRaw != null
          ? { ...operation.transactionRaw, replaceTxId: operation.hash }
          : {
              family: "bitcoin" as const,
              amount: "0",
              recipient: mainAccount.freshAddress,
              rbf: true,
              replaceTxId: operation.hash,
              utxoStrategy: { strategy: 0, excludeUTXOs: [] },
              feePerByte: null,
              networkInfo: null,
            };

      dispatch(
        openModal(editConfig.modalName, {
          account,
          parentAccount,
          transactionRaw,
          transactionHash: operation.hash,
        }),
      );
    } else {
      invariant(operation.transactionRaw, "operation.transactionRaw is required");
      dispatch(
        openModal(editConfig.modalName, {
          account,
          parentAccount,
          transactionRaw: operation.transactionRaw,
          transactionHash: operation.hash,
        }),
      );
    }
  }, [
    editConfig,
    currencyFamily,
    parentAccount,
    account,
    operation,
    mainAccount.freshAddress,
    dispatch,
  ]);

  if (!editConfig?.isSupported) {
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
