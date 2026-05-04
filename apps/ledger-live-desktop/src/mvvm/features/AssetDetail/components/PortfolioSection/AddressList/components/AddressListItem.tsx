import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { SquaredCryptoIcon } from "LLD/components/SquaredCryptoIcon";
import { useAddressListItemViewModel } from "../hooks/useAddressListItemViewModel";

type AddressListItemProps = Readonly<{
  account: AccountLike;
  lookupParentAccount: (id: string) => Account | undefined | null;
  onNavigate: (account: AccountLike, parentAccount?: Account | null) => void;
}>;

export function AddressListItem({
  account,
  lookupParentAccount,
  onNavigate,
}: AddressListItemProps) {
  const vm = useAddressListItemViewModel(account, lookupParentAccount, onNavigate);

  return (
    <ListItem onClick={vm.onClick} className="bg-surface" data-testid={vm.rowTestId}>
      <ListItemLeading>
        <ListItemContent>
          <ListItemTitle>{vm.displayName}</ListItemTitle>
          <ListItemDescription className="flex min-w-0 items-center gap-6">
            <span className="min-w-0 truncate">{vm.formattedAddress}</span>
            <SquaredCryptoIcon size={16} ledgerId={vm.networkLedgerId} ticker={vm.networkTicker} />
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ListItemContent className="items-end text-end">
          <ListItemTitle>{vm.formattedCounterValue}</ListItemTitle>
          <ListItemDescription>{vm.cryptoFormatted}</ListItemDescription>
        </ListItemContent>
      </ListItemTrailing>
    </ListItem>
  );
}
