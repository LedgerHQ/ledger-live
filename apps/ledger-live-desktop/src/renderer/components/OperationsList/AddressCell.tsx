import React from "react";
import type { Operation } from "@ledgerhq/types-live";
import type { Currency } from "@domain/entity-currency";
import { useFeature } from "@features/platform-feature-flags";
import { useAddressDisplay } from "LLD/hooks/useAddressDisplay";
import Box from "~/renderer/components/Box";
import Ellipsis from "~/renderer/components/Ellipsis";
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

const getMainCurrencyId = (currency: Currency): string => {
  switch (currency.type) {
    case "CryptoCurrency":
      return currency.id;
    case "TokenCurrency":
      return currency.parentCurrencyId;
    default:
      return "";
  }
};

function AddressCell({ currency, operation }: AddressCellProps) {
  const cryptoCurrency = "family" in currency && currency.family ? currency : null;
  const specific = useLLDCoinFamily(cryptoCurrency?.family);
  const addressCell = specific?.operationDetails?.addressCell;
  const AddressElement = addressCell ? addressCell[operation.type] : null;

  const lense =
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    perOperationType[operation.type as keyof typeof perOperationType] || perOperationType._;
  const value = lense(operation);

  const isPayTabEnabled = !!useFeature("lwdPayTab")?.enabled;
  const mainCurrencyId = getMainCurrencyId(currency);
  const { contactName, contactAddressLabel } = useAddressDisplay(value ?? "", mainCurrencyId, {
    includeContacts: isPayTabEnabled,
  });

  if (AddressElement && !!cryptoCurrency) {
    return <AddressElement operation={operation} currency={cryptoCurrency} />;
  }

  if (contactName) {
    return (
      <Cell data-testid="operation-address-contact">
        <Ellipsis ff="Inter|SemiBold" color="neutral.c100" fontSize={3}>
          {contactName}
        </Ellipsis>
        {contactAddressLabel && (
          <Ellipsis ff="Inter" color="neutral.c70" fontSize={2}>
            {contactAddressLabel}
          </Ellipsis>
        )}
      </Cell>
    );
  }

  return value ? (
    <Cell>
      <Address value={value} />
    </Cell>
  ) : (
    <Box flex={1} />
  );
}
export default React.memo(AddressCell);
