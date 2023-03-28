import React from "react";
import { TransactionRaw } from "@ledgerhq/live-common/families/ethereum/types";
import BigNumber from "bignumber.js";
import {
  EIP1559ShouldBeUsed,
  fromTransactionRaw,
} from "@ledgerhq/live-common/families/ethereum/transaction";
import { useTranslation } from "react-i18next";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import Alert from "../../components/Alert";
import LText from "../../components/LText";

export const CurrentNetworkFee = ({
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
    const transactionRaw = fromTransactionRaw(
      operation.transactionRaw as TransactionRaw,
    );
    const mainAccount = getMainAccount(account, parentAccount);
    const feePerGas = new BigNumber(
      (account.type === "Account" && EIP1559ShouldBeUsed(account.currency)) ||
      (account.type === "TokenAccount" &&
        EIP1559ShouldBeUsed(account.token.parentCurrency))
        ? transactionRaw.maxFeePerGas!
        : transactionRaw.gasPrice!,
    );

    const feeValue = new BigNumber(
      transactionRaw!.userGasLimit || transactionRaw!.estimatedGasLimit || 1,
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
