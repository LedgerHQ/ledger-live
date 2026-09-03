import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Contact, ContactAddress } from "@domain/entity-contact";
import { SEND_ADDRESS_FORMAT_OPTIONS } from "@ledgerhq/live-common/flows/send/utils";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import {
  Box,
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import React from "react";
import CurrencyIcon from "~/components/CurrencyIcon";

type RecipientContactAddressSelectionProps = Readonly<{
  contact: Contact;
  network: CryptoCurrency;
  onAddressSelect: (address: ContactAddress, addressRank: number) => void;
}>;

export function RecipientContactAddressSelection({
  contact,
  network,
  onAddressSelect,
}: RecipientContactAddressSelectionProps) {
  return (
    <Box
      testID="send-recipient-contact-address-selection"
      lx={{ gap: "s12", marginHorizontal: "s8" }}
    >
      <Box
        lx={{
          flexDirection: "row",
          alignItems: "center",
          gap: "s8",
          paddingHorizontal: "s8",
        }}
      >
        <CurrencyIcon currency={network} size={16} squared />
        <Text typography="body2" lx={{ color: "muted" }}>
          {network.name}
        </Text>
      </Box>

      <Box lx={{ gap: "s8" }}>
        {contact.addresses.map((address, index) => {
          const formattedAddress = formatAddress(address.address, SEND_ADDRESS_FORMAT_OPTIONS);

          return (
            <Card
              key={address.id}
              type="interactive"
              onPress={() => onAddressSelect(address, index + 1)}
              accessibilityLabel={`${address.label}, ${address.address}`}
              testID={`send-recipient-contact-address-${address.id}`}
            >
              <CardHeader>
                <CardLeading>
                  <CurrencyIcon currency={network} size={48} />
                  <CardContent>
                    <CardContentTitle typography="body2SemiBold">{address.label}</CardContentTitle>
                    <CardContentDescription typography="body3">
                      {formattedAddress}
                    </CardContentDescription>
                  </CardContent>
                </CardLeading>
              </CardHeader>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
