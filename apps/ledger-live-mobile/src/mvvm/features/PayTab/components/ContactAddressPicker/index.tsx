import React from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Box,
  BottomSheetHeader,
  BottomSheetView,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { Plus } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { useTranslation } from "@shared/i18n";
import { ContactAddressNetworkGroups } from "LLM/features/Contacts/components/ContactAddressNetworkGroups";
import type { ContactAddressPickerProps } from "./types";
import { useContactAddressPickerViewModel } from "./useContactAddressPickerViewModel";

export type { ContactAddressPickerProps } from "./types";

function PayContactAddAddressRow({ onPress }: Readonly<{ onPress: () => void }>) {
  const { t } = useTranslation();

  return (
    <ListItem
      onPress={onPress}
      testID="pay-contact-add-address"
      accessibilityLabel={t("contacts.addAddress")}
      lx={{ backgroundColor: "surface", borderRadius: "md" }}
    >
      <ListItemLeading>
        <Spot appearance="icon" icon={Plus} size={48} />
        <ListItemContent>
          <ListItemTitle>{t("contacts.addAddress")}</ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}

export function ContactAddressPicker(props: ContactAddressPickerProps) {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  const { isOpen, title, addressGroups, onClose, onAddressRowPress, onAddAddress } =
    useContactAddressPickerViewModel(props);

  return (
    <QueuedBottomSheet isRequestingToBeOpened={isOpen} enableDynamicSizing onClose={onClose}>
      {title ? (
        <BottomSheetView style={{ paddingBottom: bottom + 24 }}>
          <BottomSheetHeader
            spacing
            title={t("payTab.contacts.selectAddressTitle", { name: title })}
            density="expanded"
          />
          <ScrollView
            testID="pay-contact-address-picker"
            alwaysBounceVertical={false}
            showsVerticalScrollIndicator={false}
          >
            <Box
              lx={{ gap: "s24", paddingHorizontal: "s16", paddingTop: "s8", paddingBottom: "s8" }}
            >
              <ContactAddressNetworkGroups
                addressGroups={addressGroups}
                onAddressRowPress={onAddressRowPress}
                testIDPrefix="pay-contact"
              />
              <PayContactAddAddressRow onPress={onAddAddress} />
            </Box>
          </ScrollView>
        </BottomSheetView>
      ) : null}
    </QueuedBottomSheet>
  );
}
