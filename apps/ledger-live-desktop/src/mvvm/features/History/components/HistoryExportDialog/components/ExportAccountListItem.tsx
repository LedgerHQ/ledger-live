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
import FormattedVal from "~/renderer/components/FormattedVal";
import type { ExportAccount } from "../useHistoryExportDialogViewModel";

type ExportAccountListItemProps = Readonly<{
  account: ExportAccount;
  checked: boolean;
  onToggle: () => void;
}>;

export function ExportAccountListItem({ account, checked, onToggle }: ExportAccountListItemProps) {
  const unit = account.currency.units[0];

  return (
    <ListItem onClick={onToggle}>
      <ListItemLeading>
        <Checkbox checked={checked} />
        <CryptoIcon ledgerId={account.currency.id} ticker={account.currency.ticker} size="48px" />
        <ListItemContent>
          <ListItemTitle>{account.name}</ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ListItemContent>
          <ListItemTitle>
            <FormattedVal val={account.balance} unit={unit} showCode color="inherit" />
          </ListItemTitle>
        </ListItemContent>
      </ListItemTrailing>
    </ListItem>
  );
}
