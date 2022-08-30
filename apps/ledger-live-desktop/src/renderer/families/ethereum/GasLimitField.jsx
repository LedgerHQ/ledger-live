// @flow
import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { BigNumber } from "bignumber.js";
import { Trans, withTranslation } from "react-i18next";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/ethereum/types";
import { getGasLimit } from "@ledgerhq/live-common/families/ethereum/transaction";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Input from "~/renderer/components/Input";
import Label from "~/renderer/components/Label";

type Props = {
  transaction: Transaction,
  account: Account,
  status: TransactionStatus,
  updateTransaction: (updater: any) => void,
  readonly: boolean,
};

const AdvancedOptions = ({ account, transaction, status, updateTransaction, readonly = true }: Props) => {
  invariant(transaction.family === "ethereum", "AdvancedOptions: ethereum family expected");
  const [editable, setEditable] = useState(false);

  const onGasLimitChange = useCallback(
    (str: string) => {
      const bridge = getAccountBridge(account);
      let userGasLimit = BigNumber(str || 0);
      if (userGasLimit.isNaN() || !userGasLimit.isFinite()) {
        userGasLimit = BigNumber(0x5208);
      }
      updateTransaction(transaction =>
        bridge.updateTransaction(transaction, { userGasLimit, feesStrategy: "advanced" }),
      );
    },
    [account, updateTransaction],
  );

  const gasLimit = getGasLimit(transaction);
  const { gasLimit: gasLimitError } = status.errors;
  const { gasLimit: gasLimitWarning } = status.warnings;

  return (
    <Box horizontal alignItems="center" flow={1}>
      <Box>
        <Label>
          <span>
            <Trans i18nKey="send.steps.details.ethereumGasLimit" /> :
          </span>
        </Label>
      </Box>
      {(editable && !readonly) ?
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
        :
        <Box horizontal justifyContent="left">
          <Label color="p.theme.colors.palette.text.shade100">
            {gasLimit.toString()}
          </Label>
          {!readonly && <Button onClick={() => setEditable(true)} ml={1} px={2}>
            <Box horizontal alignItems="center">
              <Trans i18nKey="send.steps.details.edit" />
            </Box>
          </Button>}
        </Box>
      }
    </Box>
    
  );
};

export default withTranslation()(AdvancedOptions);
