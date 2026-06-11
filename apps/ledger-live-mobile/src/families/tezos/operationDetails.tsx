import React from "react";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { Account, Operation } from "@ledgerhq/types-live";
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

// The default operation amount resolves to the fee for STAKE ops, not the staked principal.
function OperationDetailsExtra({ account, operation }: ExtraProps) {
  const { t } = useTranslation();
  const discreet = useSelector(discreetModeSelector);
  const { locale } = useSettings();
  const unit = useAccountUnit(account);

  if (operation.type !== "STAKE") {
    return null;
  }

  const formattedAmount = formatCurrencyUnit(unit, new BigNumber(operation.value), {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  });

  return (
    <Section
      title={t("operationDetails.extra.stakedAmount")}
      value={formattedAmount}
      testID="operationDetails-stakedAmount"
    />
  );
}

type AmountCellProps = Readonly<{
  operation: Operation;
  currency: Currency;
  unit: Unit;
}>;

const StakeAmountCell = ({ operation, currency, unit }: AmountCellProps) => {
  const amount = new BigNumber(operation.value);
  return amount.isZero() ? null : (
    <>
      <Text numberOfLines={1} color="neutral.c100" variant="body" fontWeight="semiBold">
        <CurrencyUnitValue showCode unit={unit} value={amount} alwaysShowSign={false} />
      </Text>
      <Text variant="paragraph" fontWeight="medium" color="neutral.c70">
        <CounterValue
          showCode
          date={operation.date}
          currency={currency}
          value={amount}
          alwaysShowSign={false}
          withPlaceholder
        />
      </Text>
    </>
  );
};

const amountCell = {
  STAKE: StakeAmountCell,
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
