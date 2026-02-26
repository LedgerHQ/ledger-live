import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { Account, Operation } from "@ledgerhq/types-live";
import {
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import Box from "~/renderer/components/Box";
import Discreet from "~/renderer/components/Discreet";
import { Address, Cell } from "~/renderer/components/OperationsList/AddressCellShared";
import { ZCASH_SHIELDED_TX_TYPES } from "@ledgerhq/zcash-shielded/types";
import type { AddressCellProps } from "~/renderer/families/types";

class AddressCell extends PureComponent<AddressCellProps<Operation>> {
  render() {
    const { operation } = this.props;

    let value: string | undefined;
    switch (operation.type) {
      case "SHIELDED_TX_SAPLING_IN":
      case "SHIELDED_TX_ORCHARD_IN":
        value = operation.senders[0];
        break;
      case "SHIELDED_TX_SAPLING_OUT":
      case "SHIELDED_TX_ORCHARD_OUT":
        value = operation.recipients[0];
        break;
    }

    return value ? (
      <Cell>
        {ZCASH_SHIELDED_TX_TYPES.includes(operation.type) ? (
          <Discreet replace={"*".repeat(value.length)}>
            <Address value={value} />
          </Discreet>
        ) : (
          <Address value={value} />
        )}
      </Cell>
    ) : (
      <Box flex={1} />
    );
  }
}

const getI18nKey = (type: string) => {
  switch (type) {
    case "SHIELDED_TX_SAPLING_IN":
    case "SHIELDED_TX_SAPLING_OUT":
      return "zcash.operationDetails.shieldedSaplingTx";
    case "SHIELDED_TX_ORCHARD_IN":
    case "SHIELDED_TX_ORCHARD_OUT":
      return "zcash.operationDetails.shieldedOrchardTx";
    default:
      return null;
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
  const i18nKey = getI18nKey(type);

  if (account.currency.id !== "zcash" || !i18nKey) {
    return null;
  }

  return (
    <OpDetailsSection>
      <OpDetailsTitle>
        <Trans i18nKey={"zcash.operationDetails.txType"} />
      </OpDetailsTitle>
      <OpDetailsData>
        <Trans i18nKey={i18nKey} />
      </OpDetailsData>
    </OpDetailsSection>
  );
};

export default {
  addressCell: {
    SHIELDED_TX_SAPLING_IN: AddressCell,
    SHIELDED_TX_SAPLING_OUT: AddressCell,
    SHIELDED_TX_ORCHARD_IN: AddressCell,
    SHIELDED_TX_ORCHARD_OUT: AddressCell,
  },
  OperationDetailsExtra,
};
