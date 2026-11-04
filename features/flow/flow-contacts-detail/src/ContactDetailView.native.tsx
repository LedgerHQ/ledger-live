import React from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { ContactDetailViewProps } from "./ContactDetailView.types";
import { ContactDetailAddressList } from "./components/ContactDetailAddressList/ContactDetailAddressList";
import { ContactDetailEmptyState } from "./components/ContactDetailEmptyState";
import { ContactDetailHeader } from "./components/ContactDetailHeader/ContactDetailHeader";
import { LedgerWalletAddressesCard } from "./components/LedgerWalletAddressesCard";

export function ContactDetailView({
  contact,
  onAddAddress,
  ledgerWalletAccountsIntent,
  onOpenLedgerWalletAccounts,
  addressGroups,
  onOpenAddressDetail,
}: ContactDetailViewProps): React.JSX.Element {
  const { bottom } = useSafeAreaInsets();
  const hasPopulatedAddresses = addressGroups !== undefined && onOpenAddressDetail !== undefined;

  return (
    <Box testID="contacts-detail-screen" lx={{ flex: 1, backgroundColor: "base" }}>
      <ScrollView
        style={{ flex: 1 }}
        alwaysBounceVertical={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: bottom }}
        showsVerticalScrollIndicator={false}
      >
        <ContactDetailHeader contact={contact} onAddAddress={onAddAddress} />
        {ledgerWalletAccountsIntent && onOpenLedgerWalletAccounts ? (
          <LedgerWalletAddressesCard
            intent={ledgerWalletAccountsIntent}
            onPress={onOpenLedgerWalletAccounts}
          />
        ) : null}
        {hasPopulatedAddresses ? (
          <ContactDetailAddressList
            addressGroups={addressGroups}
            onAddressRowPress={onOpenAddressDetail}
          />
        ) : (
          <ContactDetailEmptyState contact={contact} />
        )}
      </ScrollView>
    </Box>
  );
}
