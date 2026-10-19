import React from "react";
import {
  Card,
  CardContent,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight, Wallet } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import type { ContactDetailLedgerWalletAccountsIntent } from "../types";

type LedgerWalletAddressesCardProps = Readonly<{
  intent: ContactDetailLedgerWalletAccountsIntent;
  onPress: (intent: ContactDetailLedgerWalletAccountsIntent) => void;
}>;

export function LedgerWalletAddressesCard({
  intent,
  onPress,
}: LedgerWalletAddressesCardProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Card
      onPress={() => onPress(intent)}
      testID="contacts-detail-ledger-wallet-addresses"
      lx={{ marginHorizontal: "s16", marginTop: "s32" }}
    >
      <CardHeader lx={{ minHeight: "s48" }}>
        <CardLeading>
          <Wallet size={20} />
          <CardContent>
            <CardContentTitle>{t("contacts.detail.ledgerWalletAddresses")}</CardContentTitle>
          </CardContent>
        </CardLeading>
        <CardTrailing>
          <ChevronRight size={20} color="muted" />
        </CardTrailing>
      </CardHeader>
    </Card>
  );
}
