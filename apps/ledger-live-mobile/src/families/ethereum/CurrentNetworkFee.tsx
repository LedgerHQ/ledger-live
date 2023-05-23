import React, { memo } from "react";
import { TransactionRaw } from "@ledgerhq/live-common/families/ethereum/types";
import BigNumber from "bignumber.js";
import {
  EIP1559ShouldBeUsed,
  fromTransactionRaw,
} from "@ledgerhq/live-common/families/ethereum/transaction";
import { useTranslation } from "react-i18next";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { log } from "@ledgerhq/logs";

import Alert from "../../components/Alert";
import LText from "../../components/LText";

const CurrentNetworkFeeComponent = ({
  account,
  parentAccount,
  operation,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  operation: Operation;
}) => {
  const { t } = useTranslation();

  if (operation && operation.transactionRaw) {
    const transaction = fromTransactionRaw(
      operation.transactionRaw as TransactionRaw,
    );

    log(
      "Edit Transaction",
      `transactionRaw.maxFeePerGas: ${transaction.maxFeePerGas}`,
    );
    log("Edit Transaction", `transactionRaw.gasPrice: ${transaction.gasPrice}`);
    log(
      "Edit Transaction",
      `transactionRaw.maxPriorityFeePerGas: ${transaction.maxPriorityFeePerGas}`,
    );

    const mainAccount = getMainAccount(account, parentAccount);
    const feePerGas = new BigNumber(
      EIP1559ShouldBeUsed(mainAccount.currency)
        ? transaction.maxFeePerGas!
        : transaction.gasPrice!,
    );

    const feeValue = new BigNumber(
      transaction.userGasLimit || transaction.estimatedGasLimit || 1,
    )
      .times(feePerGas)
      .div(new BigNumber(10).pow(mainAccount.unit.magnitude));

    return feeValue.toNumber() > 0 ? (
      <Alert type="hint">
        <LText>
          {t("editTransaction.previousFeesInfo", {
            amount: feeValue.toNumber(),
          })}
        </LText>
      </Alert>
    ) : null;
  }

  return null;
};

export const CurrentNetworkFee = memo(CurrentNetworkFeeComponent);
