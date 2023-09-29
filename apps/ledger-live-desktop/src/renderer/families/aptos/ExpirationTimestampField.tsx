import React, { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import Box from "~/renderer/components/Box";
import Input from "~/renderer/components/Input";
import Label from "~/renderer/components/Label";

import { Account } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Result } from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";

type AptosTransaction = Extract<Transaction, { family: "aptos" }>;
type Props = {
  account: Account;
  parentAccount: Account | null | undefined;
  transaction: AptosTransaction;
  status: TransactionStatus;
  updateTransaction: Result<AptosTransaction>["updateTransaction"];
};

const ExpirationTimestampField = forwardRef(function ExpirationTimestampComponent(
  { account, parentAccount, transaction, status, updateTransaction }: Props,
  ref,
) {
  invariant(transaction.family === "aptos", "ExpirationTimestamp: aptos family expected");
  const mainAccount = getMainAccount(account, parentAccount);
  invariant(mainAccount, "Account required");
  const bridge = getAccountBridge(mainAccount);
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    resetData: () => {
      setLocalValue(null);
    },
  }));

  const onExpirationTimestampChange = useCallback(
    (str: string) => {
      if (str && !BigNumber(str).isFinite()) {
        return;
      }
      setLocalValue(str);
      updateTransaction((transaction: AptosTransaction) =>
        bridge.updateTransaction(transaction, {
          options: {
            ...transaction.options,
            expirationTimestampSecs: str,
          },
          errors: Object.assign({}, transaction.errors, { expirationTimestampSecs: "" }),
        }),
      );
    },
    [updateTransaction, bridge],
  );

  const expirationTimestampSecs = transaction.firstEmulation ? "" : localValue ?? "";
  const { expirationTimestampSecs: expirationTimestampSecsError } = status.errors;
  const { expirationTimestampSecs: expirationTimestampSecsWarning } = status.warnings;

  return (
    <Box flex="1">
      <Box>
        <Label>
          <span>{t("send.steps.details.aptosExpTimestamp")}:</span>
        </Label>
      </Box>
      <Box flex="1">
        <Input
          ff="Inter"
          placeholder="Auto"
          warning={expirationTimestampSecsWarning}
          error={expirationTimestampSecsError}
          value={expirationTimestampSecs}
          onChange={onExpirationTimestampChange}
        />
      </Box>
    </Box>
  );
});

export default ExpirationTimestampField;
