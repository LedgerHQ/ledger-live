import { getEstimatedFees } from "@ledgerhq/coin-evm/logic";
import { getTypedTransaction } from "@ledgerhq/coin-evm/transaction";
import {
  Transaction as EvmTransaction,
  FeeData,
  GasOptions,
  Strategy,
} from "@ledgerhq/coin-evm/types/index";
import { getAccountCurrency, getAccountUnit } from "@ledgerhq/live-common/account/index";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
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

type Props = {
  onClick: (_: { feesStrategy: Strategy }) => void;
  transaction: EvmTransaction;
  account: Account;
  gasOptions: GasOptions;
  // FIXME: shity typing
  minFees?: {
    maxFeePerGas?: BigNumber;
    maxPriorityFeePerGas?: BigNumber;
    gasPrice?: BigNumber;
  };
};

const FeesWrapper = styled(Tabbable)`
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 6px;

  border: ${p =>
    `1px solid ${
      p?.selected ? p.theme.colors.palette.primary.main : p.theme.colors.palette.divider
    }`};
  padding: 20px 16px;
  font-family: "Inter";
  border-radius: 4px;
  width: 140px;
  ${p => (p.disabled ? `background: ${p.theme.colors.palette.background.default};` : "")};

  &:hover {
    cursor: ${p => (p.disabled ? "unset" : "pointer")};
  }
`;

const FeesHeader = styled(Box)<{ selected?: boolean; disabled?: boolean }>`
  color: ${p =>
    p.selected
      ? p.theme.colors.palette.primary.main
      : p.disabled
      ? p.theme.colors.palette.text.shade20
      : p.theme.colors.palette.text.shade50};
`;
const FeesValue = styled(Box)`
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const ApproximateTransactionTime = styled(Box)<{ selected?: boolean }>`
  flex-direction: row;
  align-items: center;
  border-radius: 3px;
  background-color: ${p =>
    p.selected ? p.theme.colors.palette.primary.main : p.theme.colors.palette.text.shade20};
  padding: 5px 6px;
`;

const strategies: Strategy[] = ["slow", "medium", "fast"];

// TODO: move this function to LLC or coin-evm?
const isStrategyDisabled = ({
  isEIP1559,
  feeData,
  minFees,
}: {
  isEIP1559: boolean;
  feeData: FeeData;
  minFees?: Props["minFees"];
}): boolean => {
  if (!minFees) {
    return false;
  }

  if (isEIP1559) {
    if (
      !feeData.maxFeePerGas ||
      !feeData.maxPriorityFeePerGas ||
      !minFees.maxFeePerGas ||
      !minFees.maxPriorityFeePerGas
    ) {
      return false;
    }

    return (
      feeData.maxFeePerGas.isLessThan(minFees.maxFeePerGas) ||
      feeData.maxPriorityFeePerGas.isLessThan(minFees.maxPriorityFeePerGas)
    );
  } else {
    if (!feeData.gasPrice || !minFees.gasPrice) {
      return false;
    }

    return feeData.gasPrice.isLessThan(minFees.gasPrice);
  }
};

const SelectFeeStrategy = ({ transaction, account, onClick, gasOptions, minFees }: Props) => {
  const accountUnit = getAccountUnit(account);
  const feesCurrency = getAccountCurrency(account);

  const feeStrategies = useMemo(
    () =>
      strategies.map(strategy => {
        const gasOption = gasOptions[strategy];
        const estimatedFees = getEstimatedFees(getTypedTransaction(transaction, gasOption));

        const disabled = isStrategyDisabled({
          isEIP1559: transaction.type === 2,
          feeData: gasOption,
          minFees,
        });
        const selected = !disabled && transaction.feesStrategy === strategy;

        // TODO: create a FeesStrategy dumb component
        // TODO: display the "custom" strategy?
        return (
          <FeesWrapper
            key={strategy}
            selected={selected}
            disabled={disabled}
            onClick={() => {
              !disabled &&
                onClick({
                  feesStrategy: strategy,
                });
            }}
          >
            <>
              <FeesHeader horizontal alignItems="center" selected={selected} disabled={disabled}>
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
                  color={
                    selected
                      ? "palette.primary.main"
                      : disabled
                      ? "palette.text.shade40"
                      : "palette.text.shade100"
                  }
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
                  color={disabled ? "palette.text.shade20" : "palette.text.shade50"}
                  fontSize={3}
                  showCode
                  alwaysShowValue
                />
              </FeesValue>
              {feesCurrency.id === "ethereum" && (
                <ApproximateTransactionTime selected={selected}>
                  <Clock size={12} />
                  <Text fontSize={2} fontWeight="500" ml={1}>
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
    [accountUnit, feesCurrency, gasOptions, onClick, transaction, minFees],
  );

  return (
    <Box horizontal justifyContent="center" flexWrap="wrap" gap="16px">
      {feeStrategies}
    </Box>
  );
};

export default memo(SelectFeeStrategy);
