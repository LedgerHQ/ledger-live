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

type AddContactActionProps = Readonly<{
  hasAddressBook: boolean;
  label: string;
  unsupportedTitle: string;
  unsupportedDescription: string;
  onAddContact: () => void;
}>;

export function AddContactAction({
  hasAddressBook,
  label,
  unsupportedTitle,
  unsupportedDescription,
  onAddContact,
}: AddContactActionProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const unsupportedSheetRef = useBottomSheetRef();

  const openUnsupportedSheet = useCallback(() => {
    Keyboard.dismiss();
    unsupportedSheetRef.current?.present();
  }, [unsupportedSheetRef]);

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
      {/* A disabled button never receives touches, so the explanation is triggered by a wrapper */}
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
          </BottomSheetContent>
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}
