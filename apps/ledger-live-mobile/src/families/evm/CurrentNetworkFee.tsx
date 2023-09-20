import React, { memo } from "react";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { TransactionRaw } from "@ledgerhq/coin-evm/types/index";
import { fromTransactionRaw } from "@ledgerhq/coin-evm/transaction";
import type { Account, AccountLike, TransactionCommonRaw } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { log } from "@ledgerhq/logs";

import Alert from "../../components/Alert";
import LText from "../../components/LText";

const CurrentNetworkFeeComponent = ({
  account,
  parentAccount,
  transactionRaw,
  advancedMode = false,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transactionRaw?: TransactionCommonRaw;
  advancedMode?: boolean;
}) => {
  const { t } = useTranslation();

  if (transactionRaw) {
    const transaction = fromTransactionRaw(transactionRaw as TransactionRaw);

    log("Edit Transaction", `transactionRaw.maxFeePerGas: ${transaction.maxFeePerGas}`);
    log("Edit Transaction", `transactionRaw.gasPrice: ${transaction.gasPrice}`);
    log(
      "Edit Transaction",
      `transactionRaw.maxPriorityFeePerGas: ${transaction.maxPriorityFeePerGas}`,
    );

    const mainAccount = getMainAccount(account, parentAccount);
    const feePerGas = new BigNumber(
      transaction.type === 2 ? transaction.maxFeePerGas! : transaction.gasPrice!,
    );

    const feeValue = new BigNumber(transaction.customGasLimit || transaction.gasLimit || 1)
      .times(feePerGas)
      .div(new BigNumber(10).pow(mainAccount.unit.magnitude));

    if (advancedMode) {
      const maxPriorityFeePerGasinGwei = new BigNumber(transaction.maxPriorityFeePerGas ?? 0)
        .dividedBy(1_000_000_000)
        .toFixed();

      const maxFeePerGasinGwei = new BigNumber(transaction.maxFeePerGas ?? 0)
        .dividedBy(1_000_000_000)
        .toFixed();

      const maxGasPriceinGwei = new BigNumber(transaction?.gasPrice ?? 0)
        .dividedBy(1_000_000_000)
        .toFixed();

      return (
        <Alert type="hint">
          {transaction.type === 2 ? (
            <View>
              <LText>
                {t("editTransaction.previousFeesInfo.maxPriorityFee", {
                  amount: maxPriorityFeePerGasinGwei,
                })}
              </LText>

              <LText>
                {t("editTransaction.previousFeesInfo.maxFee", {
                  amount: maxFeePerGasinGwei,
                })}
              </LText>
            </View>
          ) : (
            <LText>
              {t("editTransaction.previousFeesInfo.gasPrice", {
                amount: maxGasPriceinGwei,
              })}
            </LText>
          )}
        </Alert>
      );
    }

    return feeValue.toNumber() > 0 ? (
      <Alert type="hint">
        <LText>
          {t("editTransaction.previousFeesInfo.networkfee", {
            amount: feeValue.toNumber(),
            unit: mainAccount.currency.ticker,
          })}
        </LText>
      </Alert>
    ) : null;
  }

  return null;
};

export const CurrentNetworkFee = memo(CurrentNetworkFeeComponent);
