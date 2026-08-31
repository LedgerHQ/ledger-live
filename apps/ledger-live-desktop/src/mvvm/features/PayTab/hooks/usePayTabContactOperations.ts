import { useMemo } from "react";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { AccountLike } from "@ledgerhq/types-live";
import { toContactOperation, type ContactOperation } from "@features/platform-contacts";
import { useSelector } from "LLD/hooks/redux";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";

/**
 * Currency a contact address is matched on. Contact addresses are chain-level
 * ({@link resolveEligibleAddressCurrencyIds}), so token operations fold onto their parent chain to
 * match — keeping the ContactsTable count aligned with the contact-filtered History list.
 */
function contactMatchCurrencyId(account: AccountLike): string {
  const currency = getAccountCurrency(account);
  return currency.type === "TokenCurrency" ? currency.parentCurrencyId : currency.id;
}

function toContactOperations(account: AccountLike): ContactOperation[] {
  const currencyId = contactMatchCurrencyId(account);

  return [...account.pendingOperations, ...account.operations].flatMap(operation => {
    const contactOperation = toContactOperation({
      id: operation.id,
      type: operation.type,
      currencyId,
      date: operation.date,
      senders: operation.senders,
      recipients: operation.recipients,
    });
    return contactOperation ? [contactOperation] : [];
  });
}

export function usePayTabContactOperations(): ContactOperation[] {
  const accounts = useSelector(flattenAccountsSelector);

  return useMemo(() => accounts.flatMap(toContactOperations), [accounts]);
}
