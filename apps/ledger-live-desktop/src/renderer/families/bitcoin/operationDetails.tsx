import React from "react";
import { Trans } from "react-i18next";
import { Account, Operation } from "@ledgerhq/types-live";
import {
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
} from "~/renderer/drawers/OperationDetails/styledComponents";

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
  OperationDetailsExtra,
};
