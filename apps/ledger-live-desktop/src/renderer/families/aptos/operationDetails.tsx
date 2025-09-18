import React from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import CounterValue from "~/renderer/components/CounterValue";
import FormattedVal from "~/renderer/components/FormattedVal";
import {
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import { AmountCellExtraProps, OperationDetailsExtraProps } from "../types";
import { AptosAccount } from "@ledgerhq/live-common/families/aptos/types";
import { Operation } from "@ledgerhq/types-live";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

const AmountCellExtra = ({ operation, currency, unit }: AmountCellExtraProps<Operation>) => {
  const amount = operation.value;

  return !amount.isZero() ? (
    <>
      <FormattedVal val={amount} unit={unit} showCode fontSize={4} color={"palette.text.shade80"} />
      <CounterValue
        color="palette.text.shade60"
        fontSize={3}
        date={operation.date}
        currency={currency}
        value={amount}
      />
    </>
  ) : null;
};

const amountCellExtra = {
  STAKE: AmountCellExtra,
  UNSTAKE: AmountCellExtra,
  WITHDRAW: AmountCellExtra,
};

const OperationDetailsExtra = ({
  operation,
  type,
  account,
}: OperationDetailsExtraProps<AptosAccount, Operation>) => {
  const amount = operation.value;
  const unit = useAccountUnit(account);

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
            <FormattedVal unit={unit} showCode val={amount} color="palette.text.shade80" />
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

const WithdrawAmountCell = ({ operation, currency, unit }: AmountCellExtraProps<Operation>) => {
  const amount = operation.fee.negated();

  return !amount.isZero() ? (
    <>
      <FormattedVal val={amount} unit={unit} showCode fontSize={4} color={"palette.text.shade80"} />
      <CounterValue
        color="palette.text.shade60"
        fontSize={3}
        date={operation.date}
        currency={currency}
        value={amount}
      />
    </>
  ) : null;
};

const amountCell = {
  WITHDRAW: WithdrawAmountCell,
};

export default {
  amountCell,
  amountCellExtra,
  OperationDetailsExtra,
};
