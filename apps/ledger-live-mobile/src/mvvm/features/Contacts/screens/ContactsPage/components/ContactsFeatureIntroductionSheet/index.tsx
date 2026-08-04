import React, { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import {
  ContactsFeatureIntroductionContent,
  type ContactsFeatureIntroduction,
} from "@features/flow-contacts";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QueuedBottomSheet from "LLM/components/QueuedDrawer/QueuedBottomSheet";
import { useSingleFireDismiss } from "../../../../hooks/useSingleFireDismiss";

export type ContactsFeatureIntroductionSheetProps = ContactsFeatureIntroduction;

export function ContactsFeatureIntroductionSheet({
  isOpen,
  onComplete,
  onDefer,
  ...contentProps
}: ContactsFeatureIntroductionSheetProps): React.JSX.Element {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const hasCompleted = useRef(false);
  const defer = useSingleFireDismiss(onDefer, isOpen);
  const complete = useSingleFireDismiss(() => {
    hasCompleted.current = true;
    onComplete();
  }, isOpen);

  useEffect(() => {
    if (isOpen) {
      hasCompleted.current = false;
    }
  }, [isOpen]);

  const handleDrawerClose = useCallback(() => {
    if (!hasCompleted.current) {
      defer();
    }
  }, [defer]);

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={handleDrawerClose}
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
