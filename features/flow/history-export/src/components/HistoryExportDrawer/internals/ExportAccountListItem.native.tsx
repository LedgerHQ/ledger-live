import React from "react";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import {
  Box,
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
        <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s12", flex: 1 }}>
          <Checkbox checked={checked} onCheckedChange={onToggle} />
          <CryptoIcon ledgerId={account.currency.id} ticker={account.currency.ticker} size={40} />
          <ListItemContent>
            <ListItemTitle>{account.name}</ListItemTitle>
          </ListItemContent>
        </Box>
      </ListItemLeading>
      <ListItemTrailing>
        <ListItemTitle>{account.formattedBalance}</ListItemTitle>
      </ListItemTrailing>
    </ListItem>
  );
}
