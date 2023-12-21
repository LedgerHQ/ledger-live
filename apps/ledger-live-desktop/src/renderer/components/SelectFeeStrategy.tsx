import React from "react";
import styled from "styled-components";
import { useTranslation, Trans } from "react-i18next";
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
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";

export type OnClickType = {
  amount: BigNumber;
  feesStrategy: string;
};

type Props = {
  onClick: (a: OnClickType) => void;
  transaction: Transaction;
  account: Account;
  parentAccount: Account | undefined | null;
  strategies: FeeStrategy[];
  mapStrategies?: (a: FeeStrategy) => FeeStrategy & {
    [x: string]: unknown;
  };
  suffixPerByte?: boolean;
  status: TransactionStatus;
};

const FeesWrapper = styled(Box)<{ selected?: boolean; disabled?: boolean; error: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  border: ${p =>
    `1px solid ${
      p.selected
        ? p.error
          ? p.theme.colors.palette.warning.c70
          : p.theme.colors.palette.primary.main
        : p.theme.colors.palette.divider
    }`};
  ${p => (p.selected ? "box-shadow: 0px 0px 0px 4px rgba(138, 128, 219, 0.3);" : "")}
  padding: 20px 16px;
  width: 100%;
  font-family: "Inter";
  border-radius: 4px;
  ${p => (p.disabled ? `background: ${p.theme.colors.palette.background.default};` : "")};

  &:hover {
    cursor: ${p => (p.disabled ? "unset" : "pointer")};
  }
`;
const FeesHeader = styled(Box)<{ selected?: boolean; disabled?: boolean; error: boolean }>`
  color: ${p =>
    p.selected
      ? p.error
        ? p.theme.colors.palette.warning.c70
        : p.theme.colors.palette.primary.main
      : p.disabled
      ? p.theme.colors.palette.text.shade20
      : p.theme.colors.palette.text.shade50};
`;
const FeesValue = styled(Box)`
  flex-direction: row;
  align-items: center;
`;
const SelectFeeStrategy = ({
  transaction,
  account,
  parentAccount,
  onClick,
  strategies,
  mapStrategies,
  suffixPerByte,
  status,
}: Props) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const feesCurrency = getFeesCurrency(mainAccount);
  const feesUnit = getFeesUnit(feesCurrency);
  const { t } = useTranslation();
  strategies = mapStrategies ? strategies.map(mapStrategies) : strategies;

  const { errors } = status;
  const { gasPrice: messageGas } = errors;

  return (
    <Box alignItems="center" flow={2}>
      {strategies.map(s => {
        const selected = transaction.feesStrategy === s.label;
        const amount = s.displayedAmount || s.amount;
        const { label, disabled } = s;
        return (
          <FeesWrapper
            key={s.label}
            selected={selected}
            disabled={disabled}
            error={!!messageGas}
            onClick={() => {
              !disabled &&
                onClick({
                  amount: s.amount,
                  feesStrategy: label,
                });
            }}
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
                  value={amount}
                  color={disabled ? "palette.text.shade20" : "palette.text.shade50"}
                  fontSize={3}
                  mr={2}
                  showCode
                  alwaysShowValue
                />
              ) : null}
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
          </FeesWrapper>
        );
      })}
    </Box>
  );
};
export default SelectFeeStrategy;
