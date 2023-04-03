import React, { ComponentType } from "react";
import { Trans } from "react-i18next";
import { Currency, Unit, Operation, Account } from "@ledgerhq/live-common/types/index";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import CounterValue from "~/renderer/components/CounterValue";
import {
  OpDetailsTitle,
  OpDetailsData,
  OpDetailsSection,
} from "~/renderer/drawers/OperationDetails/styledComponents";
type AmountCellExtraProps = {
  operation: Operation;
  currency: Currency;
  unit: Unit;
};
const AmountCellExtra = ({ operation, currency, unit }: AmountCellExtraProps) => {
  const amount = operation.value;
  return (
    !amount.isZero() && (
      <>
        <FormattedVal
          val={amount}
          unit={unit}
          showCode
          fontSize={4}
          color={"palette.text.shade80"}
        />

        <CounterValue
          color="palette.text.shade60"
          fontSize={3}
          date={operation.date}
          currency={currency}
          value={amount}
        />
      </>
    )
  );
};
const amountCellExtra: {
  [key: string]: ComponentType<any>;
} = {
  STAKE: AmountCellExtra,
};
type OperationDetailsExtraProps = {
  operation: Operation;
  type: string;
  account: Account;
};
const OperationDetailsExtra = ({ operation, type, account }: OperationDetailsExtraProps) => {
  const amount = operation.value;
  let i18nKey = "";
  if (type === "STAKE") {
    i18nKey = "near.operationDetails.extra.stakedAmount";
  }
  if (!i18nKey || amount.isZero()) {
    return null;
  }
  return (
    <OpDetailsSection>
      <OpDetailsTitle>
        <Trans i18nKey={i18nKey} />
      </OpDetailsTitle>
      <OpDetailsData>
        <Box alignItems="flex-end">
          <Box horizontal alignItems="center">
            <FormattedVal unit={account.unit} showCode val={amount} color="palette.text.shade80" />
          </Box>
          <Box horizontal justifyContent="flex-end">
            <CounterValue
              color="palette.text.shade60"
              date={operation.date}
              fontSize={3}
              currency={account.currency}
              value={amount}
              subMagnitude={1}
              style={{
                width: "auto",
              }}
              prefix={
                <Box
                  mr={1}
                  color="palette.text.shade60"
                  style={{
                    width: "auto",
                  }}
                >
                  {"≈"}
                </Box>
              }
            />
          </Box>
        </Box>
      </OpDetailsData>
    </OpDetailsSection>
  );
};
export default {
  amountCellExtra,
  OperationDetailsExtra,
};
