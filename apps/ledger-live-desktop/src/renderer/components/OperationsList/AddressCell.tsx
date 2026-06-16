import React from "react";
import type { Operation } from "@ledgerhq/types-live";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import Box from "~/renderer/components/Box";
import { useLLDCoinFamily } from "~/renderer/families";
import { Address, Cell } from "./AddressCellShared";
export { Address, Cell, splitAddress, SplitAddress } from "./AddressCellShared";

export type AddressCellProps = {
  operation: Operation;
  currency: Currency;
};
const showSender = (o: Operation) => o.senders[0];
const showRecipient = (o: Operation) => o.recipients[0];
const perOperationType = {
  IN: showSender,
  REVEAL: showSender,
  REWARD_PAYOUT: showSender,
  _: showRecipient,
};

function AddressCell({ currency, operation }: AddressCellProps) {
  const cryptoCurrency = "family" in currency && currency.family ? currency : null;
  const specific = useLLDCoinFamily(cryptoCurrency?.family);
  const addressCell = specific?.operationDetails?.addressCell;
  const AddressElement = addressCell ? addressCell[operation.type] : null;

  if (AddressElement && !!cryptoCurrency) {
    return <AddressElement operation={operation} currency={cryptoCurrency} />;
  }

  const lense =
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    perOperationType[operation.type as keyof typeof perOperationType] || perOperationType._;
  const value = lense(operation);
  return value ? (
    <Cell>
      <Address value={value} />
    </Cell>
  ) : (
    <Box flex={1} />
  );
}
export default React.memo(AddressCell);
