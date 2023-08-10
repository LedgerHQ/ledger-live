import React, { memo } from "react";
import styled from "styled-components";
import { BigNumber } from "bignumber.js";
import {
  getAccountCurrency,
  getAccountUnit,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import { useTranslation, Trans } from "react-i18next";
import { Account, AccountLike, FeeStrategy, TransactionCommonRaw } from "@ledgerhq/types-live";
import {
  Transaction as EthereumTransaction,
  TransactionRaw as EthereumTransactionRaw,
} from "@ledgerhq/live-common/families/ethereum/types";
import TachometerMedium from "~/renderer/icons/TachometerMedium";
import CounterValue from "~/renderer/components/CounterValue";
import FormattedVal from "~/renderer/components/FormattedVal";
import TachometerHigh from "~/renderer/icons/TachometerHigh";
import TachometerLow from "~/renderer/icons/TachometerLow";
import Box, { Tabbable } from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Clock from "~/renderer/icons/Clock";
import { EIP1559ShouldBeUsed } from "@ledgerhq/live-common/families/ethereum/transaction";
import { getEnv } from "@ledgerhq/live-env";

type OnClickType = {
  amount: BigNumber;
  feesStrategy: string;
  extra?: Record<string, BigNumber>;
};

type Props = {
  onClick: (arg: OnClickType) => void;
  transaction: EthereumTransaction;
  account: AccountLike;
  parentAccount: Account | null | undefined;
  strategies: FeeStrategy[];
  mapStrategies?: (arg: FeeStrategy) => FeeStrategy;
  suffixPerByte?: boolean;
  transactionRaw?: TransactionCommonRaw;
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

const SelectFeeStrategy = ({
  transaction,
  account,
  parentAccount,
  onClick,
  strategies,
  mapStrategies,
  suffixPerByte,
  transactionRaw,
}: Props) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const accountUnit = getAccountUnit(mainAccount);
  const feesCurrency = getAccountCurrency(mainAccount);
  const { t } = useTranslation();
  strategies = mapStrategies ? strategies.map(mapStrategies) : strategies;
  if (transactionRaw) {
    // disable low transaction fee options in case of edit transaction modal
    const ethTransactionRaw = transactionRaw as EthereumTransactionRaw;
    if (EIP1559ShouldBeUsed(mainAccount.currency)) {
      const oldMaxPriorityFeePerGas = ethTransactionRaw.maxPriorityFeePerGas;
      const oldMaxFeePerGas = ethTransactionRaw.maxFeePerGas;
      const feesGap: number = getEnv("EDIT_TX_EIP1559_FEE_GAP_SPEEDUP_FACTOR");
      strategies.forEach(strategy => {
        const strategyMaxPriorityFeePerGas = strategy.extra?.maxPriorityFeePerGas;
        const strategyMaxFeePerGas = strategy.extra?.maxFeePerGas;
        if (
          oldMaxPriorityFeePerGas &&
          strategyMaxPriorityFeePerGas &&
          oldMaxFeePerGas &&
          strategyMaxFeePerGas
        ) {
          // MaxPriorityFee should be at least 10% higher than the old one
          // MaxFee should be at least old MaxFee + 10% of old MaxPriorityFee
          strategy.disabled =
            strategy.disabled ||
            strategyMaxPriorityFeePerGas.isLessThan(
              BigNumber(oldMaxPriorityFeePerGas).times(1 + feesGap),
            ) ||
            strategyMaxFeePerGas.isLessThan(BigNumber(oldMaxFeePerGas).times(1 + feesGap));
        }
      });
    } else {
      const gaspriceGap: number = getEnv("EDIT_TX_LEGACY_GASPRICE_GAP_SPEEDUP_FACTOR");
      const oldGasPrice = ethTransactionRaw.gasPrice;
      if (oldGasPrice) {
        strategies.forEach(strategy => {
          strategy.disabled =
            strategy.disabled ||
            strategy.amount.isLessThan(BigNumber(oldGasPrice).times(1 + gaspriceGap));
        });
      }
    }
  }

  return (
    <Box horizontal justifyContent="center" flexWrap="wrap" gap="16px">
      {strategies.map(strategy => {
        const amount = strategy.displayedAmount || strategy.amount;
        const { label, disabled } = strategy;
        const selected = transaction.feesStrategy === strategy.label && !disabled;

        return (
          <FeesWrapper
            key={strategy.label}
            selected={selected}
            disabled={disabled}
            onClick={() => {
              !disabled &&
                onClick({
                  amount: strategy.amount,
                  feesStrategy: label,
                  extra: strategy.extra,
                });
            }}
          >
            <>
              <FeesHeader horizontal alignItems="center" selected={selected} disabled={disabled}>
                {label === "medium" ? (
                  <TachometerMedium size={13} />
                ) : label === "slow" ? (
                  <TachometerLow size={13} />
                ) : (
                  <TachometerHigh size={13} />
                )}
                <Text fontSize={0} ff="Inter|ExtraBold" uppercase ml={1} letterSpacing="0.1em">
                  <Trans i18nKey={`fees.${label}`} />
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
                  val={amount}
                  unit={strategy.unit ?? accountUnit}
                  showCode={!suffixPerByte}
                  suffix={
                    suffixPerByte
                      ? ` ${t("send.steps.details.unitPerByte", {
                          unit: strategy.unit ? strategy.unit.code : accountUnit.code,
                        })}`
                      : ""
                  }
                  alwaysShowValue
                />
                {strategy.displayedAmount ? (
                  <CounterValue
                    currency={feesCurrency}
                    value={amount}
                    color={disabled ? "palette.text.shade20" : "palette.text.shade50"}
                    fontSize={3}
                    showCode
                    alwaysShowValue
                  />
                ) : null}
              </FeesValue>
              {feesCurrency.id === "ethereum" && (
                <ApproximateTransactionTime selected={selected}>
                  <Clock size={12} />
                  <Text fontSize={2} fontWeight="500" ml={1}>
                    {label === "medium" ? (
                      <>
                        ≈ 30 <Trans i18nKey={"time.second_short"} />
                      </>
                    ) : label === "slow" ? (
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
      })}
    </Box>
  );
};

export default memo(SelectFeeStrategy);
