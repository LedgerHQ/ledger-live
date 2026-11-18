import React from "react";
import {
  ListItem,
  ListItemLeading,
  ListItemContent,
  ListItemTitle,
  ListItemTrailing,
  Checkbox,
} from "@ledgerhq/lumen-ui-react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import type { HistoryExportAccount } from "../../../model/ports";

type ExportAccountListItemProps = Readonly<{
  account: HistoryExportAccount;
  checked: boolean;
  onToggle: () => void;
}>;

export function ExportAccountListItem({ account, checked, onToggle }: ExportAccountListItemProps) {
  return (
    <ListItem onClick={onToggle}>
      <ListItemLeading>
        <Checkbox checked={checked} />
        <CryptoIcon ledgerId={account.currency.id} ticker={account.currency.ticker} size={48} />
        <ListItemContent>
          <ListItemTitle>{account.name}</ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ListItemContent>
          <ListItemTitle>
            <span className="body-2 block w-full overflow-hidden text-ellipsis whitespace-pre">
              {account.formattedBalance}
            </span>
          </ListItemTitle>
        </ListItemContent>
      </ListItemTrailing>
    </ListItem>
  );
}
