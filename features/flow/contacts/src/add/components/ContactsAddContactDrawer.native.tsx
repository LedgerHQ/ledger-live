import React from "react";
import { Keyboard, Platform } from "react-native";
import {
  Banner,
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Text,
  TextInput,
} from "@ledgerhq/lumen-ui-rnative";
import { CONTACT_NAME_MAX_LENGTH } from "../constants";
import type { ContactsAddContactDrawerProps } from "../drawer.types";
import { shouldAddAddContactKeyboardInset } from "../keyboard";

export function ContactsAddContactDrawer({
  isOpen,
  isConfirmEnabled,
  isSaving,
  draftName,
  bottomInset = 0,
  labels,
  onDraftNameChange,
  onConfirm,
}: ContactsAddContactDrawerProps): React.JSX.Element {
  const keyboardInset = useAddContactKeyboardInset();

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + 24 + keyboardInset }}>
      {isOpen ? (
        <Box lx={{ gap: "s24" }}>
          <BottomSheetHeader />
          <Box lx={{ gap: "s16", paddingHorizontal: "s16" }}>
            <Text typography="heading3SemiBold" lx={{ color: "base" }}>
              {labels.title}
            </Text>
            <TextInput
              testID="contacts-add-contact-name-input"
              autoFocus
              placeholder={labels.namePlaceholder}
              value={draftName}
              onChangeText={name => onDraftNameChange(name.slice(0, CONTACT_NAME_MAX_LENGTH))}
              maxLength={CONTACT_NAME_MAX_LENGTH}
              maxCount={CONTACT_NAME_MAX_LENGTH}
            />
            <Banner appearance="info" description={labels.namingDisclaimer} />
          </Box>
          <Button
            appearance="base"
            size="lg"
            isFull
            disabled={!isConfirmEnabled}
            loading={isSaving}
            onPress={onConfirm}
          >
            {labels.confirmName}
          </Button>
        </Box>
      ) : null}
    </BottomSheetView>
  );
}

function useAddContactKeyboardInset(): number {
  const [keyboardInset, setKeyboardInset] = React.useState(0);
  const shouldAddInset = shouldAddAddContactKeyboardInset(Platform.OS, Platform.Version);

  React.useEffect(() => {
    if (!shouldAddInset) {
      return undefined;
    }

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    setKeyboardInset(Keyboard.metrics?.()?.height ?? 0);

    const showSubscription = Keyboard.addListener(showEvent, event => {
      setKeyboardInset(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardInset(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [shouldAddInset]);

  return shouldAddInset ? keyboardInset : 0;
}
