import React, { forwardRef, useCallback, useState, useImperativeHandle } from "react";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Result } from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import Box from "~/renderer/components/Box";
import Input from "~/renderer/components/Input";
import Label from "~/renderer/components/Label";

import { DEFAULT_GAS } from "@ledgerhq/live-common/families/aptos/logic";

type AptosTransaction = Extract<Transaction, { family: "aptos" }>;
type Props = {
  transaction: AptosTransaction;
  account: AccountLike;
  parentAccount: Account | null | undefined;
  status: TransactionStatus;
  updateTransaction: Result<AptosTransaction>["updateTransaction"];
};

const MaxGasAmountField = forwardRef(function MaxGasAmountFieldComponent(
  { account, parentAccount, transaction, status, updateTransaction }: Props,
  ref,
) {
  invariant(transaction.family === "aptos", "MaxGasAmount: aptos family expected");
  const mainAccount = getMainAccount(account, parentAccount);
  invariant(mainAccount, "Account required");
  const bridge = getAccountBridge(mainAccount);
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    resetData: () => {
      setLocalValue(transaction.estimate.maxGasAmount);
    },
  }));

  const onMaxGasAmountChange = useCallback(
    (str: string) => {
      if (str && !BigNumber(str).isFinite()) return;
      setLocalValue(str);
      updateTransaction((transaction: AptosTransaction) =>
        bridge.updateTransaction(transaction, {
          options: {
            ...transaction.options,
            maxGasAmount: str || transaction.estimate.maxGasAmount,
          },
          skipEmulation: true,
        }),
      );
    },
    [bridge, updateTransaction],
  );

  const maxGasAmount = transaction.firstEmulation
    ? transaction.estimate.maxGasAmount
    : localValue ?? transaction.options.maxGasAmount ?? transaction.estimate.maxGasAmount;
  const { maxGasAmount: maxGasAmountError } = status.errors;
  const { maxGasAmount: maxGasAmountWarning } = status.warnings;

  return (
    <Box flex="1">
      <Box mb={1}>
        <Label>
          <span>{t("send.steps.details.aptosGasLimit")}:</span>
        </Label>
      </Box>
      <Box flex="1">
        <Input
          ff="Inter"
          warning={maxGasAmountWarning}
          error={maxGasAmountError}
          value={maxGasAmount}
          onChange={onMaxGasAmountChange}
          placeholder={DEFAULT_GAS.toString()}
          loading={!transaction.estimate.maxGasAmount}
        />
      </Box>
    </Box>
  );
});

export default MaxGasAmountField;
