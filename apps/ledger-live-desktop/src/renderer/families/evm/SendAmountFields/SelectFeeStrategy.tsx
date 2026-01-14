import { isStrategyDisabled } from "@ledgerhq/coin-evm/editTransaction/index";
import { getEstimatedFees } from "@ledgerhq/coin-evm/utils";
import { getTypedTransaction } from "@ledgerhq/coin-evm/transaction";
import {
  Transaction as EvmTransaction,
  GasOptions,
  Strategy,
} from "@ledgerhq/coin-evm/types/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { Account } from "@ledgerhq/types-live";
import React, { memo, useMemo } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box, { Tabbable } from "~/renderer/components/Box";
import CounterValue from "~/renderer/components/CounterValue";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import Clock from "~/renderer/icons/Clock";
import TachometerHigh from "~/renderer/icons/TachometerHigh";
import TachometerLow from "~/renderer/icons/TachometerLow";
import TachometerMedium from "~/renderer/icons/TachometerMedium";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

type Props = {
  onClick: (_: { feesStrategy: Strategy }) => void;
  transaction: EvmTransaction;
  account: Account;
  gasOptions: GasOptions;
  transactionToUpdate?: EvmTransaction;
  status: TransactionStatus;
  disableSlowStrategy?: boolean;
};

const FeesWrapper = styled(Tabbable)<{ error?: boolean }>`
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 6px;

  border: ${p =>
    `1px solid ${
      p?.selected
        ? p?.error
          ? p.theme.colors.warning.c70
          : p.theme.colors.primary.c80
        : p.theme.colors.neutral.c40
    }`};
  padding: 20px 16px;
  font-family: "Inter";
  border-radius: 4px;
  width: 140px;
  ${p => (p.disabled ? `background: ${p.theme.colors.background.default};` : "")};

  &:hover {
    cursor: ${p => (p.disabled ? "unset" : "pointer")};
  }
`;

const FeesHeader = styled(Box)<{ selected?: boolean; disabled?: boolean; error?: boolean }>`
  color: ${p =>
    p.selected
      ? p?.error
        ? p.theme.colors.warning.c70
        : p.theme.colors.primary.c80
      : p.disabled
        ? p.theme.colors.neutral.c40
        : p.theme.colors.neutral.c70};
`;
const FeesValue = styled(Box)`
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const ApproximateTransactionTime = styled(Box)<{ selected?: boolean; error?: boolean }>`
  flex-direction: row;
  align-items: center;
  border-radius: 3px;
  background-color: ${p =>
    p.selected
      ? p?.error
        ? p.theme.colors.warning.c70
        : p.theme.colors.primary.c80
      : p.theme.colors.neutral.c40};
  padding: 5px 6px;
`;

const strategies: Strategy[] = ["slow", "medium", "fast"];

const SelectFeeStrategy = ({
  transaction,
  account,
  onClick,
  gasOptions,
  disableSlowStrategy,
  transactionToUpdate,
  status,
}: Props) => {
  const accountUnit = useAccountUnit(account);
  const feesCurrency = getAccountCurrency(account);
  const { errors } = status;
  const { gasPrice: messageGas } = errors;

  const feeStrategies = useMemo(
    () =>
      strategies.map(strategy => {
        const gasOption = gasOptions[strategy];
        const estimatedFees = getEstimatedFees(getTypedTransaction(transaction, gasOption));

        const disabled =
          (!!transactionToUpdate &&
            isStrategyDisabled({
              transaction: transactionToUpdate,
              feeData: gasOption,
            })) ||
          (strategy === "slow" && disableSlowStrategy);
        const selected = !disabled && transaction.feesStrategy === strategy;

        return (
          <FeesWrapper
            key={strategy}
            selected={selected}
            disabled={disabled}
            error={!!messageGas}
            onClick={() =>
              !disabled &&
              onClick({
                feesStrategy: strategy,
              })
            }
          >
            <>
              <FeesHeader
                horizontal
                alignItems="center"
                selected={selected}
                disabled={disabled}
                error={!!messageGas}
              >
                {strategy === "medium" ? (
                  <TachometerMedium size={13} />
                ) : strategy === "slow" ? (
                  <TachometerLow size={13} />
                ) : (
                  <TachometerHigh size={13} />
                )}
                <Text fontSize={0} ff="Inter|ExtraBold" uppercase ml={1} letterSpacing="0.1em">
                  <Trans i18nKey={`fees.${strategy}`} />
                </Text>
              </FeesHeader>
              <FeesValue>
                <FormattedVal
                  noShrink
                  inline
                  color={selected ? "primary.c80" : disabled ? "neutral.c60" : "neutral.c100"}
                  fontSize={3}
                  fontWeight="600"
                  val={estimatedFees}
                  unit={accountUnit}
                  showCode
                  alwaysShowValue
                />

                <CounterValue
                  currency={feesCurrency}
                  value={estimatedFees}
                  color={disabled ? "neutral.c40" : "neutral.c70"}
                  fontSize={3}
                  showCode
                  alwaysShowValue
                />
              </FeesValue>
              {feesCurrency.id === "ethereum" && (
                <ApproximateTransactionTime selected={selected} error={!!messageGas}>
                  <Clock size={12} color={messageGas ? "neutral.c00" : "neutral.c100"} />
                  <Text
                    fontSize={2}
                    fontWeight="500"
                    ml={1}
                    color={messageGas ? "neutral.c00" : "neutral.c100"}
                  >
                    {strategy === "medium" ? (
                      <>
                        ≈ 30 <Trans i18nKey={"time.second_short"} />
                      </>
                    ) : strategy === "slow" ? (
                      <>
                        ≈ 2-3 <Trans i18nKey={"time.minute_short"} />
                      </>
                    ) : (
                      <>
                        ≈ 15 <Trans i18nKey={"time.second_short"} />
                      </>
                    )}
                  </Text>
                </ApproximateTransactionTime>
              )}
            </>
          </FeesWrapper>
        );
      }),
    [
      accountUnit,
      feesCurrency,
      gasOptions,
      messageGas,
      onClick,
      transaction,
      disableSlowStrategy,
      transactionToUpdate,
    ],
  );

  return (
    <Box horizontal justifyContent="center" flexWrap="wrap" gap="16px">
      {feeStrategies}
    </Box>
  );
};

export default memo(SelectFeeStrategy);
