import React from "react";
import { BottomSheetHeader, BottomSheetView, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { ContactsPage, type ContactsPageProps } from "@features/flow-contacts";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { ContactsAddContactDrawer } from "./ContactsAddContactDrawer";
import type { ContactsViewModel } from "./useContactsViewModel";

type ContactsLedgerSyncIntroductionSheetProps = Readonly<
  Pick<
    ContactsPageProps["ledgerSyncIntroduction"],
    "description" | "dismissLabel" | "isOpen" | "onDismiss"
  > & {
    title: string;
    activateLabel: string;
    onActivate: () => void;
  }
>;

export function ContactsView({
  ledgerSyncIntroductionSheet,
  addContactDrawer,
  ...pageProps
}: ContactsViewModel) {
  return (
    <>
      <ContactsPage {...pageProps} />
      <ContactsLedgerSyncIntroductionSheet
        {...pageProps.ledgerSyncIntroduction}
        {...ledgerSyncIntroductionSheet}
      />
      <ContactsAddContactDrawer {...addContactDrawer} />
    </>
  );
}

function ContactsLedgerSyncIntroductionSheet({
  isOpen,
  title,
  description,
  activateLabel,
  dismissLabel,
  onActivate,
  onDismiss,
}: ContactsLedgerSyncIntroductionSheetProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedDrawerBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onDismiss}
      testID="contacts-ledger-sync-introduction-drawer"
      enableDynamicSizing
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        {isOpen ? (
          <Box lx={{ gap: "s24", paddingHorizontal: "s16" }}>
            <BottomSheetHeader />
            <Box lx={{ gap: "s12" }}>
              <Text typography="heading3SemiBold" lx={{ color: "base" }}>
                {title}
              </Text>
              <Text typography="body2" lx={{ color: "muted" }}>
                {description}
              </Text>
            </Box>
            <Box lx={{ gap: "s16" }}>
              <Button appearance="base" size="lg" isFull onPress={onActivate}>
                {activateLabel}
              </Button>
              <Button appearance="gray" size="lg" isFull onPress={onDismiss}>
                {dismissLabel}
              </Button>
            </Box>
          </Box>
        ) : null}
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}
