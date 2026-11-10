import React from "react";
import { useTranslation } from "~/context/Locale";
import type { Account, Operation } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import BigNumber from "bignumber.js";
import { useSelector } from "~/context/hooks";
import Section from "~/screens/OperationDetails/Section";
import { discreetModeSelector } from "~/reducers/settings";
import { useSettings } from "~/hooks";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { useGetExtraDetails } from "@ledgerhq/live-common/families/sui/react";
import type { SuiOperation } from "@ledgerhq/live-common/families/sui/types";
import type { Currency } from "@domain/entity-currency";
import type { Unit } from "@domain/entity-currency-unit";
import { Text } from "@ledgerhq/native-ui";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";

type Props = {
  readonly account: Account;
  readonly operation: Operation;
};

function OperationDetailsExtra({ account, operation }: Props) {
  const { t } = useTranslation();
  const discreet = useSelector(discreetModeSelector);
  const extra = useGetExtraDetails(account, operation.type, operation.hash) ?? {};
  const { locale } = useSettings();
  const type = operation.type;

  const unit = useAccountUnit(account);
  if (type !== "DELEGATE" && type !== "UNDELEGATE") {
    return null;
  }

  if (!extra.amount) {
    return null;
  }

  const formattedAmount = formatCurrencyUnit(unit, new BigNumber(extra.amount), {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  });

  return (
    <>
      <Section
        title={t("operationDetails.extra.validator")}
        value={extra.name ?? extra.address}
        testID="operationDetails-validator"
      />
      <Section
        title={t(
          type === "DELEGATE"
            ? "operationDetails.extra.delegatedAmount"
            : "operationDetails.extra.undelegatedAmount",
        )}
        value={formattedAmount}
        testID="operationDetails-delegatedAmount"
      />
    </>
  );
}

type AmountCellProps = Readonly<{
  operation: Operation;
  currency: Currency;
  unit: Unit;
}>;

// A stake operation's value is only its gas (minus the reward for an unstake); the staked
// principal is shown beside it.
function StakingAmountCell({ operation, currency, unit }: AmountCellProps) {
  const stakedAmount = (operation as SuiOperation).extra?.stakedAmount;
  if (!stakedAmount) return null;
  const amount = new BigNumber(stakedAmount);
  return (
    <>
      <Text numberOfLines={1} color="neutral.c100" variant="body" fontWeight="semiBold">
        <CurrencyUnitValue showCode unit={unit} value={amount} />
      </Text>
      <Text variant="paragraph" fontWeight="medium" color="neutral.c70">
        <CounterValue
          showCode
          date={operation.date}
          currency={currency}
          value={amount}
          withPlaceholder
        />
      </Text>
    </>
  );
}

const amountCell = {
  DELEGATE: StakingAmountCell,
  UNDELEGATE: StakingAmountCell,
};

export default {
  OperationDetailsExtra,
  amountCell,
};
