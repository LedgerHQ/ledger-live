import { getFormattedFeeFields } from "@ledgerhq/coin-evm/editTransaction/index";
import { fromTransactionRaw } from "@ledgerhq/coin-evm/transaction";
import { TransactionRaw } from "@ledgerhq/coin-evm/types/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { log } from "@ledgerhq/logs";
import { Alert, Flex } from "@ledgerhq/native-ui";
import type { Account, AccountLike, TransactionCommonRaw } from "@ledgerhq/types-live";
import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import LText from "~/components/LText";
import { useSettings } from "~/hooks";

const CurrentNetworkFeeComponent = ({
  account,
  parentAccount,
  transactionRaw,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transactionRaw?: TransactionCommonRaw;
  advancedMode?: boolean;
}) => {
  const { t } = useTranslation();
  const { locale } = useSettings();

  if (!transactionRaw) {
    return null;
  }

  const transaction = fromTransactionRaw(transactionRaw as TransactionRaw);

  log("Edit Transaction", `transactionRaw.maxFeePerGas: ${transaction.maxFeePerGas}`);
  log("Edit Transaction", `transactionRaw.gasPrice: ${transaction.gasPrice}`);
  log(
    "Edit Transaction",
    `transactionRaw.maxPriorityFeePerGas: ${transaction.maxPriorityFeePerGas}`,
  );

  const mainAccount = getMainAccount(account, parentAccount);

  const {
    formattedFeeValue,
    formattedMaxPriorityFeePerGas,
    formattedMaxFeePerGas,
    formattedGasPrice,
  } = getFormattedFeeFields({ transaction, mainAccount, locale: locale });

  return (
    <Alert type="info">
      <Flex flexDirection="column">
        <LText>
          {t("editTransaction.previousFeesInfo.networkfee", {
            amount: formattedFeeValue,
          })}
        </LText>
        {transaction.type === 2 ? (
          <>
            <LText>
              {t("editTransaction.previousFeesInfo.maxPriorityFee", {
                amount: formattedMaxPriorityFeePerGas,
              })}
            </LText>

            <LText>
              {t("editTransaction.previousFeesInfo.maxFee", {
                amount: formattedMaxFeePerGas,
              })}
            </LText>
          </>
        ) : (
          <LText>
            {t("editTransaction.previousFeesInfo.gasPrice", {
              amount: formattedGasPrice,
            })}
          </LText>
        )}
      </Flex>
    </Alert>
  );
};

export const CurrentNetworkFee = memo(CurrentNetworkFeeComponent);
