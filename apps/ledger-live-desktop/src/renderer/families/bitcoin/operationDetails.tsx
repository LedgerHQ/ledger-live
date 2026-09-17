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
import Ellipsis from "~/renderer/components/Ellipsis";
import {
  Address,
  Cell,
  SplitAddress,
  SplitAddressProps,
} from "~/renderer/components/OperationsList/AddressCellShared";
import { ZCASH_SHIELDED_TX_TYPES } from "@ledgerhq/coin-zcash/network/types";
import { isZcashShieldedAddress } from "@ledgerhq/coin-zcash/logic/address";
import type { AddressCellProps } from "~/renderer/families/types";
import { discreetModeSelector } from "~/renderer/reducers/settings";
import { useSelector } from "LLD/hooks/redux";

/**
 * A send paying into a shielded pool stays typed `OUT` -- its transparent leg
 * is all an explorer sees of it -- while the shielded leg recovers the address
 * it really paid. Discreet mode owes that address the masking it gives a
 * `SHIELDED_TX_*` operation, so what earns masking on an `OUT` is the address
 * itself being shielded; a transparent recipient, of Zcash or of any other
 * currency of the family, keeps the unmasked rendering it has always had.
 */
const shouldMask = (operation: Operation, value: string) =>
  ZCASH_SHIELDED_TX_TYPES.includes(operation.type) || isZcashShieldedAddress(value);

class AddressCell extends PureComponent<AddressCellProps<Operation>> {
  render() {
    const { operation } = this.props;

    let value: string | undefined;
    switch (operation.type) {
      case "SHIELDED_TX_SAPLING_IN":
      case "SHIELDED_TX_ORCHARD_IN":
      case "SHIELDED_TX_IRONWOOD_IN":
        value = operation.senders[0];
        break;
      case "SHIELDED_TX_SAPLING_OUT":
      case "SHIELDED_TX_ORCHARD_OUT":
      case "SHIELDED_TX_IRONWOOD_OUT":
      case "OUT":
        value = operation.recipients[0];
        break;
    }

    return value ? (
      <Cell>
        {shouldMask(operation, value) ? (
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

const getI18nKey = (operation: Operation) => {
  switch (operation.type) {
    case "SHIELDED_TX_SAPLING_IN":
    case "SHIELDED_TX_SAPLING_OUT":
      return "zcash.operationDetails.shieldedSaplingTx";
    case "SHIELDED_TX_ORCHARD_IN":
    case "SHIELDED_TX_ORCHARD_OUT":
      return "zcash.operationDetails.shieldedOrchardTx";
    case "SHIELDED_TX_IRONWOOD_IN":
    case "SHIELDED_TX_IRONWOOD_OUT":
      return "zcash.operationDetails.shieldedIronwoodTx";
    default:
      return (operation.extra as { zcashPrivate?: boolean } | undefined)?.zcashPrivate
        ? "zcash.operationDetails.shieldedIronwoodTx"
        : null;
  }
};

const OperationDetailsExtra = ({
  account,
  operation,
}: Readonly<{
  account: Account;
  operation: Operation;
}>) => {
  const i18nKey = getI18nKey(operation);

  if (account.currency.id !== "zcash") {
    return null;
  }

  const memo = (operation.extra as { memo?: string } | undefined)?.memo;

  if (!i18nKey && !memo) return null;

  return (
    <>
      {i18nKey && (
        <OpDetailsSection>
          <OpDetailsTitle>
            <Trans i18nKey={"zcash.operationDetails.txType"} />
          </OpDetailsTitle>
          <OpDetailsData>
            <Trans i18nKey={i18nKey} />
          </OpDetailsData>
        </OpDetailsSection>
      )}
      {memo && (
        <OpDetailsSection>
          <OpDetailsTitle>
            <Trans i18nKey={"zcash.operationDetails.memo"} />
          </OpDetailsTitle>
          <OpDetailsData>
            <Ellipsis>{memo}</Ellipsis>
          </OpDetailsData>
        </OpDetailsSection>
      )}
    </>
  );
};

const SplitAddressComponent = (props: SplitAddressProps) => {
  const useDiscreetMode = useSelector(discreetModeSelector);
  const newProps: SplitAddressProps = {
    ...props,
    value: useDiscreetMode ? "*".repeat(props.value.length) : props.value,
  };
  return <SplitAddress {...newProps} />;
};

/**
 * The drawer hands each address line to this component on its own, so an `OUT`
 * -- where only some lines are shielded -- decides line by line: the recovered
 * shielded destination is masked, the transparent senders it was paid from are
 * left as the chain already publishes them.
 */
const OutSplitAddressComponent = (props: SplitAddressProps) =>
  isZcashShieldedAddress(props.value) ? (
    <SplitAddressComponent {...props} />
  ) : (
    <SplitAddress {...props} />
  );

export default {
  addressCell: {
    SHIELDED_TX_SAPLING_IN: AddressCell,
    SHIELDED_TX_SAPLING_OUT: AddressCell,
    SHIELDED_TX_ORCHARD_IN: AddressCell,
    SHIELDED_TX_ORCHARD_OUT: AddressCell,
    SHIELDED_TX_IRONWOOD_IN: AddressCell,
    SHIELDED_TX_IRONWOOD_OUT: AddressCell,
    OUT: AddressCell,
  },
  OperationDetailsExtra,
  splitAddress: {
    SHIELDED_TX_SAPLING_IN: SplitAddressComponent,
    SHIELDED_TX_SAPLING_OUT: SplitAddressComponent,
    SHIELDED_TX_ORCHARD_IN: SplitAddressComponent,
    SHIELDED_TX_ORCHARD_OUT: SplitAddressComponent,
    SHIELDED_TX_IRONWOOD_IN: SplitAddressComponent,
    SHIELDED_TX_IRONWOOD_OUT: SplitAddressComponent,
    OUT: OutSplitAddressComponent,
  },
};
