import React from "react";
import { TableCellContent } from "@ledgerhq/lumen-ui-react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";

type AccountAddressCellProps = {
  readonly account: AccountLike;
  readonly lookupParentAccount: (id: string) => Account | undefined | null;
};

/** Fresh address used for display and table sorting (token rows use the parent account). */
export function getCryptoTableRowFreshAddress(
  account: AccountLike,
  lookupParentAccount: (id: string) => Account | undefined | null,
): string {
  return account.type === "Account"
    ? account.freshAddress
    : lookupParentAccount(account.parentId)?.freshAddress ?? "";
}

export function AccountAddressCell({ account, lookupParentAccount }: AccountAddressCellProps) {
  const address = getCryptoTableRowFreshAddress(account, lookupParentAccount);
  const formatted = formatAddress(address, { prefixLength: 5, suffixLength: 5 });
  return <TableCellContent title={formatted} />;
}
