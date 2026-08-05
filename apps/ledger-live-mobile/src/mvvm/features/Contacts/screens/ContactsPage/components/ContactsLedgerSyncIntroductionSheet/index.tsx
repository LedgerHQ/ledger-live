import React from "react";
import {
  ContactsLedgerSyncIntroductionContent,
  type ContactsLedgerSyncIntroductionContentProps,
} from "@features/flow-contacts";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QueuedBottomSheet from "LLM/components/QueuedDrawer/QueuedBottomSheet";

export type ContactsLedgerSyncIntroductionSheetProps = Omit<
  ContactsLedgerSyncIntroductionContentProps,
  "bottomInset"
>;

export function ContactsLedgerSyncIntroductionSheet({
  isOpen,
  title,
  description,
  activateLabel,
  dismissLabel,
  onActivate,
  onDismiss,
}: ContactsLedgerSyncIntroductionSheetProps): React.JSX.Element {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onDismiss}
      testID="contacts-ledger-sync-introduction-drawer"
      enableDynamicSizing
    >
      <ContactsLedgerSyncIntroductionContent
        isOpen={isOpen}
        title={title}
        description={description}
        activateLabel={activateLabel}
        dismissLabel={dismissLabel}
        bottomInset={bottomInset}
        onActivate={onActivate}
        onDismiss={onDismiss}
      />
    </QueuedBottomSheet>
  );
}
