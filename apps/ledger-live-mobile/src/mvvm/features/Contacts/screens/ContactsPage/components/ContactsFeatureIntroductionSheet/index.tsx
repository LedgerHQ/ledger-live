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
  const { bottom } = useSafeAreaInsets();
  const bottomInset = Platform.OS === "ios" ? bottom : 0;
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
      snapPoints="fullWithOffset"
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
