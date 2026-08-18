import React from "react";
import { Platform } from "react-native";
import {
  ContactsFeatureIntroductionContent,
  type ContactsFeatureIntroduction,
  useContactsFeatureIntroductionActions,
} from "@features/flow-contacts-introduction";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";

export type ContactsFeatureIntroductionSheetProps = ContactsFeatureIntroduction;

export function ContactsFeatureIntroductionSheet({
  isOpen,
  onComplete,
  onClose: onCloseCallback,
  ...contentProps
}: ContactsFeatureIntroductionSheetProps): React.JSX.Element {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { complete, onClose } = useContactsFeatureIntroductionActions({
    isOpen,
    onComplete,
    onClose: onCloseCallback,
  });

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      onHeaderClosePressed={onClose}
      onBackdropPress={onClose}
      testID="contacts-feature-introduction-drawer"
      enableDynamicSizing
      // iOS: allow the sheet to grow with content; uncapped on Android to avoid excess empty space.
      maxDynamicContentSize={Platform.OS === "ios" ? "fullWithOffset" : undefined}
    >
      <ContactsFeatureIntroductionContent
        isOpen={isOpen}
        onComplete={complete}
        bottomInset={bottomInset}
        {...contentProps}
      />
    </QueuedBottomSheet>
  );
}
