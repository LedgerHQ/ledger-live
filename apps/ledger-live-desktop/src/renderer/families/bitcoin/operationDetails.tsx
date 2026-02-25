import React from "react";
import { Trans } from "react-i18next";
import { Account, Operation } from "@ledgerhq/types-live";
import { AmountCellExtraProps } from "../types";
import {
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import Box from "~/renderer/components/Box";

const getI18nKey = (type: string) => {
  switch (type) {
    case "SHIELDED_TX_SAPLING_IN":
    case "SHIELDED_TX_SAPLING_OUT":
      return "zcash.operationDetails.shieldedSaplingTx";
    case "SHIELDED_TX_ORCHARD_IN":
    case "SHIELDED_TX_ORCHARD_OUT":
      return "zcash.operationDetails.shieldedOrchardTx";
    default:
      return "zcash.operationDetails.transparentTx";
  }
};

const AmountCellExtra = ({ operation, currency }: AmountCellExtraProps<Operation>) => {
  if (currency.id !== "zcash") {
    return null;
  }

  const { type } = operation;

  return (
    <Box style={{ fontSize: "12px" }}>
      <Trans i18nKey={getI18nKey(type)} />
    </Box>
  );
};

const amountCellExtra = {
  IN: AmountCellExtra,
  OUT: AmountCellExtra,
  SHIELDED_TX_SAPLING_IN: AmountCellExtra,
  SHIELDED_TX_SAPLING_OUT: AmountCellExtra,
  SHIELDED_TX_ORCHARD_IN: AmountCellExtra,
  SHIELDED_TX_ORCHARD_OUT: AmountCellExtra,
};

const OperationDetailsExtra = ({
  account,
  operation,
}: Readonly<{
  account: Account;
  operation: Operation;
}>) => {
  const { type } = operation;

  if (account.currency.id !== "zcash") {
    return null;
  }

  return (
    <OpDetailsSection>
      <OpDetailsTitle>
        <Trans i18nKey={"zcash.operationDetails.txType"} />
      </OpDetailsTitle>
      <OpDetailsData>
        <Trans i18nKey={getI18nKey(type)} />
      </OpDetailsData>
    </OpDetailsSection>
  );
};

export default {
  amountCellExtra,
  OperationDetailsExtra,
};
