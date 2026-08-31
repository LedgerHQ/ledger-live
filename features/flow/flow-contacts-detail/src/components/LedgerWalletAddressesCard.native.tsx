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
}: LedgerWalletAddressesCardProps): React.JSX.Element {
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
            <CardContentTitle>{label}</CardContentTitle>
          </CardContent>
        </CardLeading>
        <CardTrailing>
          <ChevronRight size={20} color="muted" />
        </CardTrailing>
      </CardHeader>
    </Card>
  );
}
