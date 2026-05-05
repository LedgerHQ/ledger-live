import React from "react";
import { TableCellContent } from "@ledgerhq/lumen-ui-react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { getCryptoAccountAddress } from "LLD/features/CryptoAddresses/utils/getCryptoAccountAddress";

type AccountAddressCellProps = {
  readonly account: AccountLike;
  readonly lookupParentAccount: (id: string) => Account | undefined | null;
};

export function AccountAddressCell({ account, lookupParentAccount }: AccountAddressCellProps) {
  const address = getCryptoAccountAddress(account, lookupParentAccount);
  const formatted = formatAddress(address, { prefixLength: 5, suffixLength: 5 });
  return <TableCellContent title={formatted} />;
}
