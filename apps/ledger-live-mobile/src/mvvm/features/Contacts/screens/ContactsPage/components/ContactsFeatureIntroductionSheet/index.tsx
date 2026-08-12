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
  onDefer,
  ...contentProps
}: ContactsFeatureIntroductionSheetProps): React.JSX.Element {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { complete, defer, onClose } = useContactsFeatureIntroductionActions({
    isOpen,
    onComplete,
    onDefer,
  });

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      onHeaderClosePressed={defer}
      onBackdropPress={defer}
      testID="contacts-feature-introduction-drawer"
      enableDynamicSizing
      // iOS: allow the sheet to grow with content; uncapped on Android to avoid excess empty space.
      maxDynamicContentSize={Platform.OS === "ios" ? "fullWithOffset" : undefined}
    >
      <ContactsFeatureIntroductionContent
        isOpen={isOpen}
        onComplete={complete}
        onDefer={defer}
        bottomInset={bottomInset}
        {...contentProps}
      />
    </QueuedBottomSheet>
  );
}
