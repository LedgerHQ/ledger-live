import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight, Wallet } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "@shared/i18n";
import type { ContactDetailLedgerWalletAccountsIntent } from "../types";

type LedgerWalletAddressesCardProps = Readonly<{
  intent: ContactDetailLedgerWalletAccountsIntent;
  onPress: (intent: ContactDetailLedgerWalletAccountsIntent) => void;
}>;

export function LedgerWalletAddressesCard({
  intent,
  onPress,
}: LedgerWalletAddressesCardProps): React.ReactNode {
  const { t } = useTranslation();

  return (
    <ListItem
      onClick={() => onPress(intent)}
      className="shrink-0 bg-surface"
      data-testid="contacts-detail-ledger-wallet-addresses"
    >
      <ListItemLeading>
        <Wallet size={20} aria-hidden />
        <ListItemContent>
          <ListItemTitle>{t("contacts.detail.ledgerWalletAddresses")}</ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ChevronRight size={20} aria-hidden />
      </ListItemTrailing>
    </ListItem>
  );
}
