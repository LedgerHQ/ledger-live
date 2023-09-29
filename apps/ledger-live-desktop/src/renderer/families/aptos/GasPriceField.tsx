import React, { useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { BigNumber } from "bignumber.js";
import { Result } from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import invariant from "invariant";
import { Account } from "@ledgerhq/types-live";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import Box from "~/renderer/components/Box";
import Input from "~/renderer/components/Input";
import Label from "~/renderer/components/Label";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { DEFAULT_GAS_PRICE } from "@ledgerhq/live-common/families/aptos/logic";
import { useTranslation } from "react-i18next";

type AptosTransaction = Extract<Transaction, { family: "aptos" }>;
type Props = {
  account: Account;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
  updateTransaction: Result<AptosTransaction>["updateTransaction"];
};

const FeesField = forwardRef(function FeesFieldComponent(
  { account, parentAccount, transaction, status, updateTransaction }: Props,
  ref,
) {
  invariant(transaction.family === "aptos", "FeeField: aptos family expected");
  const mainAccount = getMainAccount(account, parentAccount);
  invariant(mainAccount, "Account required");
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState<string | null>(null);
  const bridge = getAccountBridge(mainAccount);

  useImperativeHandle(ref, () => ({
    resetData: () => {
      setLocalValue(transaction.estimate.gasUnitPrice);
    },
  }));

  const onGasPriceChange = useCallback(
    (str: string) => {
      if (str && !BigNumber(str).isFinite()) return;
      setLocalValue(str);
      updateTransaction((transaction: AptosTransaction) =>
        bridge.updateTransaction(transaction, {
          options: {
            ...transaction.options,
            gasUnitPrice: str || transaction.estimate.gasUnitPrice,
          },
          skipEmulation: true,
        }),
      );
    },
    [updateTransaction, bridge],
  );

  const gasUnitPrice = transaction.firstEmulation
    ? transaction.estimate.gasUnitPrice
    : localValue ?? transaction.options.gasUnitPrice ?? transaction.estimate.gasUnitPrice;
  const { gasUnitPrice: gasPriceError } = status.errors;
  const { gasUnitPrice: gasPriceWarning } = status.warnings;
  return (
    <Box flex="1">
      <Box>
        <Label>
          <span>{t("send.steps.details.aptosGasPrice")}:</span>
        </Label>
      </Box>
      <Box flex="1">
        <Input
          ff="Inter"
          warning={gasPriceWarning}
          error={gasPriceError}
          value={gasUnitPrice.toString()}
          onChange={onGasPriceChange}
          placeholder={DEFAULT_GAS_PRICE.toString()}
          loading={!transaction.estimate.gasUnitPrice}
        />
      </Box>
    </Box>
  );
});
export default FeesField;
