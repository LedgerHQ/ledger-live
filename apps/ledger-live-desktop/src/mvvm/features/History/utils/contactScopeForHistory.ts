import type { Contact } from "@domain/entity-contact";
import { findContactOperationsToAddresses, toContactOperation } from "@features/platform-contacts";
import type { OperationTableItem } from "../types";

/**
 * Currency a contact address is matched on: token rows fold onto their parent chain, mirroring
 * {@link OperationCounterpartyCell}. Account rows are never fiat, so `null` is effectively unused.
 */
function contactMatchCurrencyId(currency: OperationTableItem["currency"]): string | null {
  if (currency.type === "TokenCurrency") return currency.parentCurrencyId;
  if (currency.type === "CryptoCurrency") return currency.id;
  return null;
}

/** Keeps only the send/receive rows whose counterparty is one of the contact's addresses. */
export function filterOperationTableItemsByContact(
  items: readonly OperationTableItem[],
  contact: Contact,
): OperationTableItem[] {
  return items.filter(item => {
    const currencyId = contactMatchCurrencyId(item.currency);
    if (currencyId === null) return false;

    const operation = toContactOperation({
      id: item.id,
      type: item.type,
      currencyId,
      date: item.date,
      senders: item.operation.senders,
      recipients: item.operation.recipients,
    });
    return (
      operation !== null &&
      findContactOperationsToAddresses(contact.addresses, [operation]).length > 0
    );
  });
}
