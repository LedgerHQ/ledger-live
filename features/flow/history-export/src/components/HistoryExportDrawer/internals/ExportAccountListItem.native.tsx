import React from "react";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import {
  Checkbox,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import type { HistoryExportAccount } from "../../../model/ports";

type ExportAccountListItemProps = Readonly<{
  account: HistoryExportAccount;
  checked: boolean;
  onToggle: () => void;
}>;

export function ExportAccountListItem({ account, checked, onToggle }: ExportAccountListItemProps) {
  return (
    <ListItem onPress={onToggle} testID={`history-export-account-${account.id}`}>
      <ListItemLeading>
        <Checkbox checked={checked} onCheckedChange={onToggle} />
        <CryptoIcon ledgerId={account.currency.id} ticker={account.currency.ticker} size={32} />
        <ListItemContent>
          <ListItemTitle>{account.name}</ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ListItemTitle>{account.formattedBalance}</ListItemTitle>
      </ListItemTrailing>
    </ListItem>
  );
}
