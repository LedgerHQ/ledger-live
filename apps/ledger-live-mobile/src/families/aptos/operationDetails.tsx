import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import type { Account, Operation } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { useSelector } from "react-redux";
import Section from "~/screens/OperationDetails/Section";
import { discreetModeSelector } from "~/reducers/settings";
import { useSettings } from "~/hooks";
import { useAccountUnit } from "~/hooks/useAccountUnit";
import LText from "~/components/LText";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";

const STAKING_OP_TYPES = ["STAKE", "UNSTAKE", "WITHDRAW"];

function OperationDetailsExtra({
  account,
  operation,
}: Readonly<{
  account: Account;
  operation: Operation;
}>) {
  const { t } = useTranslation();
  const discreet = useSelector(discreetModeSelector);
  const { locale } = useSettings();
  const { type } = operation;

  const unit = useAccountUnit(account);
  if (!STAKING_OP_TYPES.includes(type)) {
    return null;
  }

  let i18nKey = "";
  switch (type) {
    case "STAKE":
      i18nKey = "aptos.operationDetails.extra.stakedAmount";
      break;
    case "UNSTAKE":
      i18nKey = "aptos.operationDetails.extra.unstakedAmount";
      break;
    case "WITHDRAW":
      i18nKey = "aptos.operationDetails.extra.withdrawnAmount";
      break;
  }

  const formattedAmount = formatCurrencyUnit(unit, new BigNumber(operation.value), {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale: locale,
  });

  return (
    <Section title={t(i18nKey)} value={formattedAmount} testID="operationDetails-delegatedAmount" />
  );
}

const AmountCell = ({
  operation,
  amount,
  currency,
  unit,
}: {
  operation: Operation;
  amount: BigNumber;
  currency: Currency;
  unit: Unit;
}) =>
  !amount.isZero() ? (
    <>
      <LText semiBold numberOfLines={1} style={styles.topText}>
        <CurrencyUnitValue showCode unit={unit} value={amount} alwaysShowSign={false} />
      </LText>

      <LText numberOfLines={1} style={styles.amountText} color="grey">
        <CounterValue
          showCode
          date={operation.date}
          currency={currency}
          value={amount}
          alwaysShowSign={false}
          withPlaceholder
        />
      </LText>
    </>
  ) : null;

const StakingAmountCell = ({
  operation,
  currency,
  unit,
}: {
  operation: Operation;
  currency: Currency;
  unit: Unit;
}) => {
  const amount = operation.value || new BigNumber(0);
  return <AmountCell amount={amount} operation={operation} currency={currency} unit={unit} />;
};

const styles = StyleSheet.create({
  amountText: {
    fontSize: 14,
    flex: 1,
  },
  topText: {
    fontSize: 14,
    flex: 1,
  },
  voteText: {
    lineHeight: 40,
  },
});

const amountCell = {
  STAKE: StakingAmountCell,
  UNSTAKE: StakingAmountCell,
  WITHDRAW: StakingAmountCell,
};

export default {
  OperationDetailsExtra,
  amountCell,
};
