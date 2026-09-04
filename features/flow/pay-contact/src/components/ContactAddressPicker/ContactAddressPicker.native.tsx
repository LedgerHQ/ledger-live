import React from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
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
  const { bottom } = useSafeAreaInsets();

  return (
    <QueuedBottomSheet isRequestingToBeOpened={isOpen} enableDynamicSizing onClose={onClose}>
      {isOpen && contact ? (
        <BottomSheetView style={{ paddingBottom: bottom + 24 }}>
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
        </BottomSheetView>
      ) : null}
    </QueuedBottomSheet>
  );
}
