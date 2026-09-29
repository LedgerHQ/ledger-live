import React from "react";
import { ScrollView } from "react-native";
import { Box, BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import type { ContactAddressPickerProps } from "../../types";
import { ContactAddressPickerAddAddress } from "./components/ContactAddressPickerAddAddress/ContactAddressPickerAddAddress.native";
import { ContactAddressPickerNetworkSection } from "./components/ContactAddressPickerNetworkSection/ContactAddressPickerNetworkSection.native";

export function ContactAddressPicker({
  isOpen,
  contact,
  title,
  addAddressLabel,
  groups,
  onClose,
  onSelectAddress,
  onAddNewAddress,
}: ContactAddressPickerProps) {
  return (
    <QueuedBottomSheet isRequestingToBeOpened={isOpen} enableDynamicSizing onClose={onClose}>
      {isOpen && contact ? (
        <ContactAddressPickerContent>
          <BottomSheetHeader spacing title={title} density="expanded" />
          <ScrollView
            testID="pay-contact-address-picker"
            alwaysBounceVertical={false}
            showsVerticalScrollIndicator={false}
          >
            <Box
              lx={{ gap: "s24", paddingHorizontal: "s16", paddingTop: "s8", paddingBottom: "s8" }}
            >
              {groups.map(group => (
                <ContactAddressPickerNetworkSection
                  key={group.networkId}
                  group={group}
                  onSelectAddress={onSelectAddress}
                />
              ))}
              {onAddNewAddress ? (
                <ContactAddressPickerAddAddress
                  label={addAddressLabel}
                  onAddNewAddress={onAddNewAddress}
                />
              ) : null}
            </Box>
          </ScrollView>
        </ContactAddressPickerContent>
      ) : null}
    </QueuedBottomSheet>
  );
}

function ContactAddressPickerContent({ children }: Readonly<{ children: React.ReactNode }>) {
  const bottomInset = useBottomSheetBottomInset();

  return <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>{children}</BottomSheetView>;
}
