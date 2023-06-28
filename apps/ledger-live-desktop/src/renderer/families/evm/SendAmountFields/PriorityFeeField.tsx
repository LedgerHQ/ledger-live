import { Transaction, TransactionStatus } from "@ledgerhq/coin-evm/types";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Account, AccountBridge, AccountLike } from "@ledgerhq/types-live";
import { Strategy } from "@ledgerhq/coin-evm/lib/types";
import { Result } from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { inferDynamicRange } from "@ledgerhq/live-common/range";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import React, { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { urls } from "~/config/urls";
import { track } from "~/renderer/analytics/segment";
import Box from "~/renderer/components/Box";
import InputCurrency from "~/renderer/components/InputCurrency";
import Label from "~/renderer/components/Label";
import LabelWithExternalIcon from "~/renderer/components/LabelWithExternalIcon";
import TranslatedError from "~/renderer/components/TranslatedError";
import { openURL } from "~/renderer/linking";

const ErrorContainer = styled(Box)<{ hasError?: boolean }>`
  margin-top: 0px;
  font-size: 10px;
  width: 100%;
  transition: all 0.4s ease-in-out;
  will-change: max-height;
  max-height: ${p => (p.hasError ? 60 : 0)}px;
  min-height: ${p => (p.hasError ? 22 : 0)}px;
`;

const ErrorDisplay = styled(Box)`
  color: ${p => p.theme.colors.pearl};
`;

const WarningDisplay = styled(Box)`
  color: ${p => p.theme.colors.warning};
`;

const FeesValues = styled.span`
  color: ${p => p.theme.colors.neutral.c90};
`;

const WhiteSpacedLabel = styled(Label)`
  white-space: pre;
  color: ${p => p.theme.colors.neutral.c60};
`;

const strategies: Strategy[] = ["slow", "medium", "fast"];

type Props = {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
  updateTransaction: Result<Transaction>["updateTransaction"];
};

const fallbackMaxPriorityFeePerGas = inferDynamicRange(new BigNumber(10e9));

const FeesField = ({ account, parentAccount, transaction, status, updateTransaction }: Props) => {
  invariant(transaction.family === "evm", "FeeField: evm family expected");
  const mainAccount = getMainAccount(account, parentAccount);

  const bridge: AccountBridge<Transaction> = getAccountBridge(mainAccount);
  const { t } = useTranslation();

  const onPriorityFeeChange = useCallback(
    (maxPriorityFeePerGas: BigNumber) =>
      updateTransaction((transaction: Transaction) =>
        bridge.updateTransaction(transaction, {
          maxPriorityFeePerGas,
          feesStrategy: "custom",
        }),
      ),
    [updateTransaction, bridge],
  );

  const { gasOptions } = transaction;

  invariant(gasOptions, "PriorityFeeField: 'transaction.gasOptions' should be defined");

  strategies.forEach(strategy => {
    invariant(
      gasOptions[strategy].maxPriorityFeePerGas,
      `PriorityFeeField: 'gasOptions[${strategy.toString()}].maxPriorityFeePerGas' should be defined`,
    );
  });

  const { maxPriorityFeePerGas: maxPriorityFee } = transaction;

  const { units } = mainAccount.currency;
  const unit = units.length > 1 ? units[1] : units[0];
  const unitName = unit.code;

  const [lowPriorityFeeValue, highPriorityFeeValue] = useMemo(
    () => [
      formatCurrencyUnit(
        unit,
        gasOptions?.slow.maxPriorityFeePerGas || fallbackMaxPriorityFeePerGas.min,
      ),
      formatCurrencyUnit(
        unit,
        gasOptions?.fast.maxPriorityFeePerGas || fallbackMaxPriorityFeePerGas.max,
      ),
    ],
    [gasOptions?.slow, gasOptions?.fast, unit],
  );

  const validTransactionError = status.errors.maxPriorityFee;
  const validTransactionWarning = status.warnings.maxPriorityFee;

  return (
    <Box mb={1}>
      <LabelWithExternalIcon
        onClick={() => {
          openURL(urls.feesEIP1559MoreInfo);
          track("Send Flow EIP1559 Fees Help Requested");
        }}
        label={t("send.steps.details.ethereumPriorityFee", { unitName })}
      />
      <Box mt={2} mb={2}>
        <InputCurrency
          hideErrorMessage
          error={validTransactionError}
          warning={validTransactionWarning}
          containerProps={{ grow: true }}
          defaultUnit={unit}
          value={maxPriorityFee}
          onChange={onPriorityFeeChange}
        />
      </Box>
      <ErrorContainer hasError={!!validTransactionError || !!validTransactionWarning}>
        {validTransactionError ? (
          <ErrorDisplay id="input-error">
            <TranslatedError error={validTransactionError} />
          </ErrorDisplay>
        ) : validTransactionWarning ? (
          <WarningDisplay id="input-warning">
            <TranslatedError error={validTransactionWarning} />
          </WarningDisplay>
        ) : null}
      </ErrorContainer>
      <WhiteSpacedLabel>
        {`${t("send.steps.details.suggested")} : `}
        <FeesValues>
          {lowPriorityFeeValue} - {highPriorityFeeValue} {unitName}
        </FeesValues>
      </WhiteSpacedLabel>
    </Box>
  );
};

export default memo(FeesField);
