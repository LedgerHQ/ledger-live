import React, { useCallback, useEffect, useRef } from "react";
import {
  ContactsLedgerSyncIntroductionContent,
  type ContactsLedgerSyncIntroductionContentProps,
} from "@features/flow-contacts-introduction";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";

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
  const skipNextCloseTracking = useRef(false);

  useEffect(() => {
    if (isOpen) {
      skipNextCloseTracking.current = false;
    }
  }, [isOpen]);

  const handleActivate = useCallback(() => {
    skipNextCloseTracking.current = true;
    onActivate();
  }, [onActivate]);

  const handleDismiss = useCallback(() => {
    skipNextCloseTracking.current = true;
    onDismiss();
  }, [onDismiss]);

  const handleClose = useCallback(() => {
    if (skipNextCloseTracking.current) {
      skipNextCloseTracking.current = false;
      return;
    }
    onDismiss();
  }, [onDismiss]);

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={handleClose}
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
        onActivate={handleActivate}
        onDismiss={handleDismiss}
      />
    </QueuedBottomSheet>
  );
}
