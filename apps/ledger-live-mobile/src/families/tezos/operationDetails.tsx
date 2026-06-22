import React from "react";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { Account, Operation, OperationType } from "@ledgerhq/types-live";
import type { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { Text } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { discreetModeSelector } from "~/reducers/settings";
import { useSettings } from "~/hooks";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import Section from "~/screens/OperationDetails/Section";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";

type ExtraProps = Readonly<{
  account: Account;
  operation: Operation;
}>;

// getOperationAmountNumber drives the Operation Details header amount, but it returns the fee for
// stake-family ops (STAKE/UNSTAKE) and 0 for the uncategorized FINALIZE_UNSTAKE — so the principal
// never reaches the header. Surface it here as an extra section, matching what the list row's
// amountCell shows.
const stakingAmountLabel: Partial<Record<OperationType, { i18nKey: string; testID: string }>> = {
  STAKE: {
    i18nKey: "operationDetails.extra.stakedAmount",
    testID: "operationDetails-stakedAmount",
  },
  UNSTAKE: {
    i18nKey: "operationDetails.extra.unstakedAmount",
    testID: "operationDetails-unstakedAmount",
  },
  FINALIZE_UNSTAKE: {
    i18nKey: "operationDetails.extra.withdrawnAmount",
    testID: "operationDetails-withdrawnAmount",
  },
};

function OperationDetailsExtra({ account, operation }: ExtraProps) {
  const { t } = useTranslation();
  const discreet = useSelector(discreetModeSelector);
  const { locale } = useSettings();
  const unit = useAccountUnit(account);

  const label = stakingAmountLabel[operation.type];
  if (!label) {
    return null;
  }

  const formattedAmount = formatCurrencyUnit(unit, new BigNumber(operation.value), {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  });

  return <Section title={t(label.i18nKey)} value={formattedAmount} testID={label.testID} />;
}

type AmountCellProps = Readonly<{
  operation: Operation;
  currency: Currency;
  unit: Unit;
}>;

// STAKE/UNSTAKE show the principal with no sign (the row renders the fee separately);
// FINALIZE_UNSTAKE returns funds to the spendable balance, so it shows a signed "+amount".
const makeStakingAmountCell = (alwaysShowSign: boolean) => {
  const StakingAmountCell = ({ operation, currency, unit }: AmountCellProps) => {
    const amount = new BigNumber(operation.value);
    return amount.isZero() ? null : (
      <>
        <Text numberOfLines={1} color="neutral.c100" variant="body" fontWeight="semiBold">
          <CurrencyUnitValue showCode unit={unit} value={amount} alwaysShowSign={alwaysShowSign} />
        </Text>
        <Text variant="paragraph" fontWeight="medium" color="neutral.c70">
          <CounterValue
            showCode
            date={operation.date}
            currency={currency}
            value={amount}
            alwaysShowSign={alwaysShowSign}
            withPlaceholder
          />
        </Text>
      </>
    );
  };
  return StakingAmountCell;
};

const amountCell = {
  STAKE: makeStakingAmountCell(false),
  UNSTAKE: makeStakingAmountCell(false),
  FINALIZE_UNSTAKE: makeStakingAmountCell(true),
};

export default {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getURLWhatIsThis: (op: Operation, currencyId: string) =>
    op.type !== "IN" && op.type !== "OUT"
      ? "https://support.ledger.com/article/360010653260-zd?redirect=false"
      : null,
  OperationDetailsExtra,
  amountCell,
};
