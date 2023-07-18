import { getGasLimit } from "@ledgerhq/coin-evm/logic";
import { DEFAULT_GAS_LIMIT } from "@ledgerhq/coin-evm/transaction";
import { Transaction } from "@ledgerhq/coin-evm/types/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Button } from "@ledgerhq/react-ui";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import Box from "~/renderer/components/Box";
import Input from "~/renderer/components/Input";
import Label from "~/renderer/components/Label";
import { EvmFamily } from "../types";

const AdvancedOptions: NonNullable<EvmFamily["sendAmountFields"]>["component"] = ({
  account,
  transaction,
  status,
  updateTransaction,
}) => {
  invariant(transaction.family === "evm", "AdvancedOptions: evm family expected");
  invariant(account, "Account required");
  const [editable, setEditable] = useState(false);
  const { t } = useTranslation();

  const onGasLimitChange = useCallback(
    (str: string) => {
      const bridge = getAccountBridge(account);
      let gasLimit = new BigNumber(str || 0);
      if (!gasLimit.isFinite()) {
        gasLimit = DEFAULT_GAS_LIMIT;
      }
      updateTransaction((transaction: Transaction) =>
        bridge.updateTransaction(transaction, { customGasLimit: gasLimit }),
      );
    },
    [account, updateTransaction],
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

export default memo(AdvancedOptions);
