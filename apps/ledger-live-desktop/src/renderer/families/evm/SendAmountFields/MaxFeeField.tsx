import React, { memo, useCallback, useMemo } from "react";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/coin-evm/lib/types/index";
import { urls } from "~/config/urls";
import { track } from "~/renderer/analytics/segment";
import Box from "~/renderer/components/Box";
import InputCurrency from "~/renderer/components/InputCurrency";
import Label from "~/renderer/components/Label";
import LabelWithExternalIcon from "~/renderer/components/LabelWithExternalIcon";
import TranslatedError from "~/renderer/components/TranslatedError";
import { openURL } from "~/renderer/linking";
import { EvmFamily } from "../types";

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

const FeesField: NonNullable<EvmFamily["sendAmountFields"]>["component"] = ({
  account,
  transaction,
  status,
  updateTransaction,
}) => {
  invariant(transaction.family === "evm", "MaxFeeField: evm family expected");
  invariant(transaction.type === 2, "MaxFeeField: transaction should be of type 2 (EIP1559)");

  const bridge: AccountBridge<Transaction> = getAccountBridge(account);
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

  const { maxFeePerGas } = transaction;
  const { units } = account.currency;
  const unit = units.length > 1 ? units[1] : units[0];
  const unitName = unit.code;

  const nextBaseFeeValue = useMemo(
    () =>
      formatCurrencyUnit(unit, transaction.gasOptions?.medium.nextBaseFee || new BigNumber(0), {
        showCode: true,
        disableRounding: true,
      }),
    [transaction.gasOptions?.medium.nextBaseFee, unit],
  );

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

export default memo(FeesField);
