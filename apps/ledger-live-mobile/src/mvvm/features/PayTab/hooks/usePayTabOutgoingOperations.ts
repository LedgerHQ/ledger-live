import { useMemo } from "react";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { AccountLike, Operation } from "@ledgerhq/types-live";
import type { OutgoingOperation } from "@features/platform-contacts";
import { useSelector } from "~/context/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";

function toOutgoingOperations(account: AccountLike): OutgoingOperation[] {
  const currencyId = getAccountCurrency(account).id;
  const operations: Operation[] = [...account.pendingOperations, ...account.operations];

  return operations
    .filter(operation => operation.type === "OUT")
    .flatMap(operation =>
      operation.recipients.map(recipientAddress => ({
        id: operation.id,
        recipientAddress,
        date: operation.date.getTime(),
        currencyId,
      })),
    );
}

/**
 * Account `OUT` operations (pending included) flattened into the platform DTO, used to order the Pay
 * contacts by last sent-to.
 */
export function usePayTabOutgoingOperations(): OutgoingOperation[] {
  const accounts = useSelector(flattenAccountsSelector);

  return useMemo(() => accounts.flatMap(toOutgoingOperations), [accounts]);
}
