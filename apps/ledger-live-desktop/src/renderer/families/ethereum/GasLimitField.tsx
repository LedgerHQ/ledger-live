import React, { useCallback, useState } from "react";
import {
  Transaction as EthereumTransaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/ethereum/types";
import { getGasLimit } from "@ledgerhq/live-common/families/ethereum/transaction";
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
  transaction: EthereumTransaction;
  account: AccountLike;
  parentAccount: Account | null | undefined;
  status: TransactionStatus;
  updateTransaction: Result<EthereumTransaction>["updateTransaction"];
};

const DEFAULT_GAS_LIMIT = new BigNumber(21000);

const AdvancedOptions = ({
  account,
  parentAccount,
  transaction,
  status,
  updateTransaction,
}: Props) => {
  invariant(transaction.family === "ethereum", "AdvancedOptions: ethereum family expected");
  const mainAccount = getMainAccount(account, parentAccount);
  invariant(mainAccount, "Account required");
  const [editable, setEditable] = useState(false);
  const { t } = useTranslation();

  const onGasLimitChange = useCallback(
    (str: string) => {
      const bridge = getAccountBridge(mainAccount);
      let userGasLimit = new BigNumber(str || 0);
      if (!userGasLimit.isFinite()) {
        userGasLimit = DEFAULT_GAS_LIMIT;
      }
      updateTransaction(transaction =>
        bridge.updateTransaction(transaction, { userGasLimit, feesStrategy: "custom" }),
      );
    },
    [mainAccount, updateTransaction],
  );

  const onEditClick = useCallback(() => setEditable(true), [setEditable]);

  const gasLimit = getGasLimit(transaction);
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
            loading={!transaction.networkInfo && !transaction.userGasLimit}
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
