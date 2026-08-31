import { useMemo } from "react";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { AccountLike } from "@ledgerhq/types-live";
import type { OutgoingOperation } from "@features/platform-contacts";
import { useSelector } from "LLD/hooks/redux";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";

function toOutgoingOperations(account: AccountLike): OutgoingOperation[] {
  const currencyId = getAccountCurrency(account).id;

  return [...account.pendingOperations, ...account.operations].flatMap(operation =>
    operation.type !== "OUT"
      ? []
      : operation.recipients.map(recipientAddress => ({
          id: operation.id,
          recipientAddress,
          date: operation.date.getTime(),
          currencyId,
        })),
  );
}

export function usePayTabOutgoingOperations(): OutgoingOperation[] {
  const accounts = useSelector(flattenAccountsSelector);

  return useMemo(() => accounts.flatMap(toOutgoingOperations), [accounts]);
}
