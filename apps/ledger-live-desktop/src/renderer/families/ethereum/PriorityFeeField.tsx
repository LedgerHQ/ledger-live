import React, { useCallback, useMemo } from "react";
import invariant from "invariant";
import BigNumber from "bignumber.js";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {
  Transaction as EthereumTransaction,
  TransactionStatus,
  TransactionRaw as EthereumTransactionRaw,
} from "@ledgerhq/live-common/families/ethereum/types";
import { inferDynamicRange } from "@ledgerhq/live-common/range";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Result } from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { Account, AccountBridge, AccountLike, TransactionCommonRaw } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import LabelWithExternalIcon from "~/renderer/components/LabelWithExternalIcon";
import TranslatedError from "~/renderer/components/TranslatedError";
import InputCurrency from "~/renderer/components/InputCurrency";
import { track } from "~/renderer/analytics/segment";
import Label from "~/renderer/components/Label";
import { openURL } from "~/renderer/linking";
import Box from "~/renderer/components/Box";
import { urls } from "~/config/urls";
import { getEnv } from "@ledgerhq/live-env";
import { PriorityFeeTooLow } from "@ledgerhq/errors";

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

type Props = {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: EthereumTransaction;
  status: TransactionStatus;
  updateTransaction: Result<EthereumTransaction>["updateTransaction"];
  transactionRaw?: TransactionCommonRaw;
};

const fallbackMaxPriorityFeePerGas = inferDynamicRange(new BigNumber(10e9));

const FeesField = ({
  account,
  parentAccount,
  transaction,
  status,
  updateTransaction,
  transactionRaw,
}: Props) => {
  invariant(transaction.family === "ethereum", "FeeField: ethereum family expected");
  const mainAccount = getMainAccount(account, parentAccount);

  const bridge: AccountBridge<EthereumTransaction> = getAccountBridge(mainAccount);
  const { t } = useTranslation();

  const onPriorityFeeChange = useCallback(
    (maxPriorityFeePerGas: BigNumber) =>
      updateTransaction(transaction =>
        bridge.updateTransaction(transaction, {
          maxPriorityFeePerGas,
          feesStrategy: "custom",
        }),
      ),
    [updateTransaction, bridge],
  );

  const networkPriorityFee = useMemo(
    () => transaction.networkInfo?.maxPriorityFeePerGas || fallbackMaxPriorityFeePerGas,
    [transaction.networkInfo],
  );

  const maxPriorityFee = transaction.maxPriorityFeePerGas || fallbackMaxPriorityFeePerGas.initial;
  const { units } = mainAccount.currency;
  const unit = units.length > 1 ? units[1] : units[0];
  const unitName = unit.code;

  let [lowPriorityFeeValue, highPriorityFeeValue] = useMemo(
    () => [
      formatCurrencyUnit(unit, networkPriorityFee.min),
      formatCurrencyUnit(unit, networkPriorityFee.max),
    ],
    [networkPriorityFee.max, networkPriorityFee.min, unit],
  );

  // update suggested max priority fee according to previous pending transaction if necessary
  const ethTransactionRaw = transactionRaw as EthereumTransactionRaw | undefined;
  if (ethTransactionRaw && ethTransactionRaw.maxPriorityFeePerGas) {
    // update the range to make sure that new maxPriorityFeePerGas is at least 10% higher than the pending transaction
    const maxPriorityFeeGap: number = getEnv("EDIT_TX_EIP1559_FEE_GAP_SPEEDUP_FACTOR");
    const newMaxPriorityFeePerGas = new BigNumber(ethTransactionRaw.maxPriorityFeePerGas).times(
      1 + maxPriorityFeeGap,
    );
    const newMaxPriorityFeePerGasinGwei = formatCurrencyUnit(unit, newMaxPriorityFeePerGas);
    if (
      new BigNumber(newMaxPriorityFeePerGasinGwei).isGreaterThan(new BigNumber(lowPriorityFeeValue))
    ) {
      lowPriorityFeeValue = newMaxPriorityFeePerGasinGwei;
    }
    if (
      new BigNumber(newMaxPriorityFeePerGasinGwei).isGreaterThan(
        new BigNumber(highPriorityFeeValue),
      )
    ) {
      highPriorityFeeValue = newMaxPriorityFeePerGasinGwei;
    }
    // give user an error if maxPriorityFeePerGas is lower than pending transaction maxPriorityFeePerGas + 10% for edit eth transaction feature
    if (
      !status.errors.maxPriorityFee &&
      transaction.maxPriorityFeePerGas &&
      transaction.maxPriorityFeePerGas.isLessThan(newMaxPriorityFeePerGas)
    ) {
      status.errors.maxPriorityFee = new PriorityFeeTooLow();
    }
  }

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

export default FeesField;
