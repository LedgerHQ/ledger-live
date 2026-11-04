import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import type { AccountAssetPickerProps, AccountAssetPickerRow } from "../AccountAssetPicker.types";

const ICON_SIZE = 48;

function AccountAssetPickerListItem({
  row,
  onSelect,
  testID,
}: Readonly<{
  row: AccountAssetPickerRow;
  onSelect: (id: string) => void;
  testID?: string;
}>) {
  return (
    <ListItem onClick={() => onSelect(row.id)} data-testid={testID}>
      <ListItemLeading>
        <CryptoIcon ledgerId={row.ledgerId} ticker={row.ticker} size={ICON_SIZE} />
        <ListItemContent>
          <ListItemTitle>{row.name}</ListItemTitle>
          <ListItemDescription>{row.ticker}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ListItemContent className="items-end text-end">
          <ListItemTitle>{row.countervalue ?? row.cryptoAmount}</ListItemTitle>
          {row.countervalue ? <ListItemDescription>{row.cryptoAmount}</ListItemDescription> : null}
        </ListItemContent>
      </ListItemTrailing>
    </ListItem>
  );
}

export function AccountAssetPickerContent({
  rows,
  onSelect,
  testID,
}: Omit<AccountAssetPickerProps, "open" | "onClose">) {
  return (
    <div className="-mx-8 flex flex-col">
      {rows.map(row => (
        <AccountAssetPickerListItem
          key={row.id}
          row={row}
          onSelect={onSelect}
          testID={testID && `${testID}-${row.id}`}
        />
      ))}
    </div>
  );
}
