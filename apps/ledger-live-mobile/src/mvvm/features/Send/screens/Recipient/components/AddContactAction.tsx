import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Text,
  useBottomSheetRef,
} from "@ledgerhq/lumen-ui-rnative";
import React, { useCallback } from "react";
import { Keyboard, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "~/context/Locale";

type AddContactActionProps = Readonly<{
  hasAddressBook: boolean;
  label: string;
  unsupportedTitle: string;
  unsupportedDescription: string;
  onAddContact: () => void;
  onUnsupportedNetwork: () => void;
  onDismissUnsupportedNetwork: () => void;
}>;

export function AddContactAction({
  hasAddressBook,
  label,
  unsupportedTitle,
  unsupportedDescription,
  onAddContact,
  onUnsupportedNetwork,
  onDismissUnsupportedNetwork,
}: AddContactActionProps) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const unsupportedSheetRef = useBottomSheetRef();

  const openUnsupportedSheet = useCallback(() => {
    Keyboard.dismiss();
    onUnsupportedNetwork();
    unsupportedSheetRef.current?.present();
  }, [onUnsupportedNetwork, unsupportedSheetRef]);

  const dismissUnsupportedSheet = useCallback(() => {
    onDismissUnsupportedNetwork();
    unsupportedSheetRef.current?.dismiss();
  }, [onDismissUnsupportedNetwork, unsupportedSheetRef]);

  const handleAddContact = useCallback(() => {
    Keyboard.dismiss();
    onAddContact();
  }, [onAddContact]);

  const button = (
    <Button
      appearance="gray"
      size="sm"
      onPress={handleAddContact}
      disabled={!hasAddressBook}
      testID="send-recipient-card-add-contact"
      isFull
    >
      {label}
    </Button>
  );

  if (hasAddressBook) {
    return <Box lx={{ flex: 1 }}>{button}</Box>;
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={unsupportedTitle}
        onPress={openUnsupportedSheet}
        testID="send-recipient-card-add-contact-unsupported-trigger"
        style={{ flex: 1 }}
      >
        <Box
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {button}
        </Box>
      </Pressable>

      <BottomSheet
        ref={unsupportedSheetRef}
        enableDynamicSizing
        snapPoints={null}
        testID="send-address-book-unsupported-sheet"
      >
        <BottomSheetView style={{ paddingBottom: bottomInset }}>
          <BottomSheetHeader density="compact" />
          <BottomSheetContent lx={{ gap: "s12", paddingBottom: "s24" }}>
            <Text typography="heading3SemiBold" lx={{ color: "base" }}>
              {unsupportedTitle}
            </Text>
            <Text typography="body1" lx={{ color: "base" }}>
              {unsupportedDescription}
            </Text>
            <Button
              appearance="base"
              size="lg"
              onPress={dismissUnsupportedSheet}
              testID="send-address-book-unsupported-got-it"
              isFull
            >
              {t("common.gotit")}
            </Button>
          </BottomSheetContent>
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}
