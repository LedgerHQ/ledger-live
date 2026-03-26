import React from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import CounterValue from "~/renderer/components/CounterValue";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import { getAleoTransactionTypeLabelKey } from "../../../shared/utils";
import type { AleoFamily } from "../../../types";

const StepSummaryAmountRow: NonNullable<AleoFamily["StepSummaryAmountRow"]> = ({
  amount,
  currency,
  transaction,
  unit,
}) => {
  const balanceTypeLabelKey = getAleoTransactionTypeLabelKey(transaction);

  return (
    <Box horizontal justifyContent="space-between" mb={2}>
      <Box>
        <Text ff="Inter|Medium" color="neutral.c60" fontSize={4}>
          <Trans i18nKey="send.steps.details.amount" />
        </Text>
        <Text ff="Inter|Medium" color="neutral.c70" fontSize={4}>
          <Trans i18nKey={balanceTypeLabelKey} />
        </Text>
      </Box>
      <Box>
        <FormattedVal
          color="neutral.c80"
          disableRounding
          unit={unit}
          val={amount}
          fontSize={4}
          inline
          showCode
          alwaysShowValue
          data-testid="transaction-amount"
        />
        <Box textAlign="right">
          <CounterValue
            color="neutral.c70"
            fontSize={3}
            currency={currency}
            value={amount}
            alwaysShowSign={false}
            alwaysShowValue
          />
        </Box>
      </Box>
    </Box>
  );
};

export default StepSummaryAmountRow;
