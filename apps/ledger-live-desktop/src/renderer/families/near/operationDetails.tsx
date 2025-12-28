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
import { NearAccount } from "@ledgerhq/live-common/families/near/types";
import { Operation } from "@ledgerhq/types-live";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

const AmountCellExtra = ({ operation, currency, unit }: AmountCellExtraProps<Operation>) => {
  const amount = operation.value;
  return !amount.isZero() ? (
    <>
      <FormattedVal val={amount} unit={unit} showCode fontSize={4} color={"neutral.c80"} />

      <CounterValue
        color="neutral.c70"
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
};

const OperationDetailsExtra = ({
  operation,
  type,
  account,
}: OperationDetailsExtraProps<NearAccount, Operation>) => {
  const amount = operation.value;
  const unit = useAccountUnit(account);
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
            <FormattedVal unit={unit} showCode val={amount} color="neutral.c80" />
          </Box>
          <Box horizontal justifyContent="flex-end">
            <CounterValue
              color="neutral.c70"
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
                  color="neutral.c70"
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
