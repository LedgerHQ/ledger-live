import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight, Wallet } from "@ledgerhq/lumen-ui-react/symbols";
import type { ContactDetailLedgerWalletAccountsIntent } from "../types";

type LedgerWalletAddressesCardProps = Readonly<{
  label: string;
  intent: ContactDetailLedgerWalletAccountsIntent;
  onPress: (intent: ContactDetailLedgerWalletAccountsIntent) => void;
}>;

export function LedgerWalletAddressesCard({
  label,
  intent,
  onPress,
}: LedgerWalletAddressesCardProps): React.ReactNode {
  return (
    <ListItem
      onClick={() => onPress(intent)}
      className="bg-surface"
      data-testid="contacts-detail-ledger-wallet-addresses"
    >
      <ListItemLeading>
        <Wallet size={20} aria-hidden />
        <ListItemContent>
          <ListItemTitle>{label}</ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ChevronRight size={20} aria-hidden />
      </ListItemTrailing>
    </ListItem>
  );
}
