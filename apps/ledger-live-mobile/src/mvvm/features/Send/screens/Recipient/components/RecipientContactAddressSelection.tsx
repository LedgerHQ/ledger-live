import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Contact } from "@domain/entity-contact";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import { SEND_ADDRESS_FORMAT_OPTIONS } from "@ledgerhq/live-common/flows/send/utils";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetView,
  Box,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Text,
  useBottomSheetRef,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight } from "@ledgerhq/lumen-ui-rnative/symbols";
import React, { useCallback, useEffect } from "react";

type RecipientContactAddressSelectionProps = Readonly<{
  contact?: Contact;
  network: CryptoCurrency;
  onAddressSelect: (address: string) => void;
  onDismiss: () => void;
}>;

export function RecipientContactAddressSelection({
  contact,
  network,
  onAddressSelect,
  onDismiss,
}: RecipientContactAddressSelectionProps) {
  const bottomSheetRef = useBottomSheetRef();

  useEffect(() => {
    if (contact) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [bottomSheetRef, contact]);

  const handleAddressSelect = useCallback(
    (address: string) => {
      bottomSheetRef.current?.dismiss();
      onAddressSelect(address);
    },
    [bottomSheetRef, onAddressSelect],
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      enableDynamicSizing
      snapPoints={null}
      onClose={onDismiss}
      testID="send-recipient-contact-address-selection"
    >
      <BottomSheetView>
        <BottomSheetHeader title={contact?.name} />
        {contact ? (
          <Box lx={{ paddingHorizontal: "s16", paddingBottom: "s24", gap: "s8" }}>
            <Box
              lx={{
                flexDirection: "row",
                alignItems: "center",
                gap: "s8",
                paddingHorizontal: "s8",
              }}
            >
              <CryptoIcon ledgerId={network.id} ticker={network.ticker} size={16} shape="square" />
              <Text typography="body2" lx={{ color: "muted" }}>
                {network.name}
              </Text>
            </Box>

            {contact.addresses.map(address => (
              <ListItem
                key={address.id}
                density="expanded"
                onPress={() => handleAddressSelect(address.address)}
                testID={`send-recipient-contact-address-${address.id}`}
              >
                <ListItemLeading>
                  <CryptoIcon
                    ledgerId={network.id}
                    ticker={network.ticker}
                    network={address.currencyId === network.id ? undefined : network.id}
                    size={40}
                  />
                  <ListItemContent>
                    <ListItemTitle>{address.label}</ListItemTitle>
                    <ListItemDescription ellipsizeMode="middle">
                      {formatAddress(address.address, SEND_ADDRESS_FORMAT_OPTIONS)}
                    </ListItemDescription>
                  </ListItemContent>
                </ListItemLeading>
                <ListItemTrailing>
                  <ChevronRight size={24} />
                </ListItemTrailing>
              </ListItem>
            ))}
          </Box>
        ) : null}
      </BottomSheetView>
    </BottomSheet>
  );
}
