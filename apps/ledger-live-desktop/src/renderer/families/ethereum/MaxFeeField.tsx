import React, { useCallback, useMemo } from "react";
import invariant from "invariant";
import BigNumber from "bignumber.js";
import styled from "styled-components";
import { getEnv } from "@ledgerhq/live-env";
import { useTranslation } from "react-i18next";
import {
  Transaction as EthereumTransaction,
  TransactionRaw as EthereumTransactionRaw,
} from "@ledgerhq/live-common/families/ethereum/types";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { AccountBridge } from "@ledgerhq/types-live";
import { track } from "~/renderer/analytics/segment";
import Box from "~/renderer/components/Box";
import InputCurrency from "~/renderer/components/InputCurrency";
import Label from "~/renderer/components/Label";
import LabelWithExternalIcon from "~/renderer/components/LabelWithExternalIcon";
import TranslatedError from "~/renderer/components/TranslatedError";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import { MaxFeeTooLow } from "@ledgerhq/errors";
import { EthereumFamily } from "./types";

const ErrorContainer = styled(Box)<{ hasError: Error }>`
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

const FeesField: NonNullable<EthereumFamily["sendAmountFields"]>["component"] = ({
  account,
  parentAccount,
  transaction,
  status,
  updateTransaction,
  transactionRaw,
}) => {
  invariant(transaction.family === "ethereum", "FeeField: ethereum family expected");

  const mainAccount = getMainAccount(account, parentAccount);
  const bridge: AccountBridge<EthereumTransaction> = getAccountBridge(mainAccount);
  const { t } = useTranslation();

  const onMaxFeeChange = useCallback(
    (maxFeePerGas: BigNumber) =>
      updateTransaction(() =>
        bridge.updateTransaction(transaction, {
          maxFeePerGas,
          feesStrategy: "custom",
        }),
      ),
    [bridge, transaction, updateTransaction],
  );

  const defaultMaxFeePerGas = useMemo(
    () =>
      transaction.networkInfo?.nextBaseFeePerGas
        ?.times(getEnv("EIP1559_BASE_FEE_MULTIPLIER"))
        .plus(transaction?.maxPriorityFeePerGas || 0)
        .integerValue(),
    [transaction.maxPriorityFeePerGas, transaction.networkInfo?.nextBaseFeePerGas],
  );

  const maxFeePerGas = transaction.maxFeePerGas || defaultMaxFeePerGas;
  const { units } = mainAccount.currency;
  const unit = units.length > 1 ? units[1] : units[0];
  const unitName = unit.code;

  const nextBaseFeeValue = useMemo(
    () =>
      formatCurrencyUnit(unit, transaction.networkInfo?.nextBaseFeePerGas || new BigNumber(0), {
        showCode: true,
        disableRounding: true,
      }),
    [transaction.networkInfo?.nextBaseFeePerGas, unit],
  );

  // give user an error if maxFeePerGas is lower than pending transaction maxFeePerGas + 10% of pending transaction maxPriorityFeePerGas for edit eth transaction feature
  const ethTransactionRaw = transactionRaw as EthereumTransactionRaw | undefined;
  if (
    !status.errors.maxFee &&
    ethTransactionRaw &&
    ethTransactionRaw.maxPriorityFeePerGas &&
    ethTransactionRaw.maxFeePerGas
  ) {
    const maxPriorityFeeGap: number = getEnv("EDIT_TX_EIP1559_FEE_GAP_SPEEDUP_FACTOR");
    const lowerLimitMaxFeePerGas = new BigNumber(ethTransactionRaw.maxFeePerGas).times(
      1 + maxPriorityFeeGap,
    );
    if (transaction.maxFeePerGas && transaction.maxFeePerGas.isLessThan(lowerLimitMaxFeePerGas)) {
      status.errors.maxFee = new MaxFeeTooLow();
    }
  }
  const validTransactionError = status.errors.maxFee;
  const validTransactionWarning = status.warnings.maxFee;
  return (
    <Box mb={1}>
      <LabelWithExternalIcon
        onClick={() => {
          openURL(urls.feesEIP1559MoreInfo);
          track("Send Flow EIP1559 Fees Help Requested");
        }}
        label={t("send.steps.details.ethereumMaxFee", { unitName })}
      />
      <Box mt={2} mb={2}>
        <InputCurrency
          hideErrorMessage
          error={validTransactionError}
          warning={validTransactionWarning}
          containerProps={{ grow: true }}
          defaultUnit={unit}
          value={maxFeePerGas}
          onChange={onMaxFeeChange}
        />
      </Box>
      <ErrorContainer hasError={validTransactionError || validTransactionWarning}>
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
        {`${t("send.steps.details.nextBlock")} : `}
        <FeesValues>{nextBaseFeeValue}</FeesValues>
      </WhiteSpacedLabel>
    </Box>
  );
};

export default FeesField;
