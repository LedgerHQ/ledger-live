import React, { useCallback, useState } from "react";
import { Transaction, TransactionStatus } from "@ledgerhq/coin-evm/types";
import { DEFAULT_GAS_LIMIT } from "@ledgerhq/coin-evm/transaction";
import { Result } from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { Button } from "@ledgerhq/react-ui";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import Box from "~/renderer/components/Box";
import Input from "~/renderer/components/Input";
import Label from "~/renderer/components/Label";

type Props = {
  transaction: Transaction;
  account: AccountLike;
  parentAccount: Account | null | undefined;
  status: TransactionStatus;
  updateTransaction: Result<Transaction>["updateTransaction"];
};

const AdvancedOptions = ({
  account,
  parentAccount,
  transaction,
  status,
  updateTransaction,
}: Props) => {
  invariant(transaction.family === "evm", "AdvancedOptions: evm family expected");
  const mainAccount = getMainAccount(account, parentAccount);
  invariant(mainAccount, "Account required");
  const [editable, setEditable] = useState(false);
  const { t } = useTranslation();

  const onGasLimitChange = useCallback(
    (str: string) => {
      const bridge = getAccountBridge(mainAccount);
      let gasLimit = new BigNumber(str || 0);
      if (!gasLimit.isFinite()) {
        gasLimit = DEFAULT_GAS_LIMIT;
      }
      updateTransaction((transaction: Transaction) =>
        bridge.updateTransaction(transaction, { gasLimit, feesStrategy: "custom" }),
      );
    },
    [mainAccount, updateTransaction],
  );

  const onEditClick = useCallback(() => setEditable(true), [setEditable]);

  const { gasLimit } = transaction;
  const { gasLimit: gasLimitError } = status.errors;
  const { gasLimit: gasLimitWarning } = status.warnings;

  return (
    <Box horizontal alignItems="center" flow={1}>
      <Box>
        <Label>
          <span>{t("send.steps.details.ethereumGasLimit")}:</span>
        </Label>
      </Box>
      {editable ? (
        <Box flex="1">
          <Input
            ff="Inter"
            warning={gasLimitWarning}
            error={gasLimitError}
            value={gasLimit.toString()}
            onChange={onGasLimitChange}
          />
        </Box>
      ) : (
        <Box horizontal justifyContent="left">
          <Label color="p.theme.colors.palette.text.shade100">{gasLimit.toString()}</Label>
          <Button
            borderRadius={4}
            variant="shade"
            outline
            size="small"
            onClick={onEditClick}
            ml={2}
          >
            <Box horizontal alignItems="center">
              {t("send.steps.details.edit")}
            </Box>
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default AdvancedOptions;
