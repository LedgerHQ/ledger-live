import React from "react";
import styled from "styled-components";
import { Trans, useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import TachometerHigh from "~/renderer/icons/TachometerHigh";
import TachometerLow from "~/renderer/icons/TachometerLow";
import TachometerMedium from "~/renderer/icons/TachometerMedium";
import FormattedVal from "~/renderer/components/FormattedVal";
import CounterValue from "~/renderer/components/CounterValue";
import { getFeesCurrency, getFeesUnit, getMainAccount } from "@ledgerhq/live-common/account/index";
import { Account, FeeStrategy } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import Clock from "~/renderer/icons/Clock";

export type OnClickType = {
  amount: BigNumber;
  feesStrategy: string;
};

type Props = {
  onClick: (a: OnClickType) => void;
  transaction: Transaction;
  account: Account;
  strategies: FeeStrategy[];
  mapStrategies?: (a: FeeStrategy) => FeeStrategy & {
    [x: string]: unknown;
  };
  suffixPerByte?: boolean;
  status: TransactionStatus;
};

const FeesWrapper = styled(Box)<{ selected?: boolean; disabled?: boolean; error: boolean }>`
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 6px;

  border: ${p =>
    `1px solid ${
      p.selected
        ? p.error
          ? p.theme.colors.warning.c70
          : p.theme.colors.primary.c80
        : p.theme.colors.neutral.c40
    }`};
  ${p => (p.selected ? "box-shadow: 0px 0px 0px 4px rgba(138, 128, 219, 0.3);" : "")}
  padding: 20px 16px;
  width: 140px;
  font-family: "Inter";
  border-radius: 4px;
  ${p => (p.disabled ? `background: ${p.theme.colors.background.default};` : "")};

  &:hover {
    cursor: ${p => (p.disabled ? "unset" : "pointer")};
  }
`;
const FeesHeader = styled(Box)<{ selected?: boolean; disabled?: boolean; error: boolean }>`
  color: ${p =>
    p.selected
      ? p.error
        ? p.theme.colors.warning.c70
        : p.theme.colors.primary.c80
      : p.disabled
        ? p.theme.colors.neutral.c40
        : p.theme.colors.neutral.c70};
`;
const FeesValue = styled(Box)`
  flex-direction: row;
  align-items: center;
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

const SelectFeeStrategyKaspa = ({
  transaction,
  account,
  onClick,
  strategies,
  mapStrategies,
  suffixPerByte,
  status,
}: Props) => {
  const mainAccount = getMainAccount(account);
  const feesCurrency = getFeesCurrency(mainAccount);
  const feesUnit = getFeesUnit(feesCurrency);
  const { t } = useTranslation();
  strategies = mapStrategies ? strategies.map(mapStrategies) : strategies;

  const { errors } = status;
  const { gasPrice: messageGas } = errors;

  const approxTime = (estimatedMs: BigNumber | undefined) => {
    if (estimatedMs === undefined || estimatedMs.lt(1000)) {
      estimatedMs = BigNumber(1000);
    }

    if (estimatedMs.lt(1000 * 60)) {
      return (
        <>
          ≈ {estimatedMs.dividedBy(1000).decimalPlaces(0, BigNumber.ROUND_HALF_UP).toString()}{" "}
          <Trans i18nKey={"time.second_short"} />
        </>
      );
    } else {
      return (
        <>
          ≈{" "}
          {estimatedMs
            .dividedBy(1000 * 60)
            .decimalPlaces(0, BigNumber.ROUND_HALF_UP)
            .toString()}{" "}
          <Trans i18nKey={"time.minute_short"} />
        </>
      );
    }
  };

  return (
    <Box horizontal justifyContent="center" flexWrap="wrap" gap="16px">
      {strategies.map(s => {
        const amount = s.amount;
        const { label, disabled, extra } = s;
        const selected = transaction.feesStrategy === s.label && !disabled;
        return (
          <FeesWrapper
            key={s.label}
            selected={selected}
            disabled={disabled}
            error={!!messageGas}
            onClick={() =>
              !disabled &&
              onClick({
                amount: s.amount,
                feesStrategy: label,
              })
            }
          >
            <FeesHeader
              horizontal
              alignItems="center"
              selected={selected}
              disabled={disabled}
              error={!!messageGas}
            >
              {label === "medium" ? (
                <TachometerMedium size={14} />
              ) : label === "slow" ? (
                <TachometerLow size={14} />
              ) : (
                <TachometerHigh size={14} />
              )}
              <Text fontSize={0} ff="Inter|ExtraBold" uppercase ml={1}>
                <Trans i18nKey={`fees.${label}`} />
              </Text>
            </FeesHeader>
            <FeesValue>
              {s.displayedAmount ? (
                <CounterValue
                  currency={feesCurrency}
                  value={amount.times(2)}
                  color={disabled ? "neutral.c40" : "neutral.c70"}
                  fontSize={3}
                  mr={2}
                  showCode
                  alwaysShowValue
                />
              ) : null}
              <FormattedVal
                noShrink
                inline
                color={selected ? "primary.c80" : disabled ? "neutral.c60" : "neutral.c100"}
                fontSize={3}
                fontWeight="600"
                val={amount}
                unit={s.unit ?? feesUnit}
                showCode={!suffixPerByte}
                suffix={
                  suffixPerByte
                    ? ` ${t("send.steps.details.unitPerByte", {
                        unit: s.unit ? s.unit.code : feesUnit.code,
                      })}`
                    : ""
                }
                alwaysShowValue
              />
            </FeesValue>
            <ApproximateTransactionTime selected={selected} error={!!messageGas}>
              <Clock size={12} color={messageGas ? "neutral.c00" : "neutral.c100"} />
              <Text
                fontSize={2}
                fontWeight="500"
                ml={1}
                color={messageGas ? "neutral.c00" : "neutral.c100"}
              >
                <>{approxTime(extra?.estimatedMs)}</>
              </Text>
            </ApproximateTransactionTime>
          </FeesWrapper>
        );
      })}
    </Box>
  );
};
export default SelectFeeStrategyKaspa;
