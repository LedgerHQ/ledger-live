import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import { SquaredCryptoIcon } from "LLD/components/SquaredCryptoIcon";
import type { AddressListItemViewModel } from "../hooks/useAddressListItemViewModel";

export type AddressListItemViewProps = Readonly<{
  vm: AddressListItemViewModel;
}>;

export function AddressListItemView({ vm }: AddressListItemViewProps) {
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
