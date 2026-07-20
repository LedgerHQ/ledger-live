import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { BottomSheetHeader, BottomSheetView, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { ContactsPage, type ContactsPageProps } from "@features/flow-contacts";
import { SvgUri } from "react-native-svg";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ledgerSyncLineLeftAsset = require("./assets/ledger-sync-line-left.svg");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ledgerSyncLineRightAsset = require("./assets/ledger-sync-line-right.svg");

export function ContactsView({ ledgerSyncIntroductionSheet, ...pageProps }: ContactsViewModel) {
  return (
    <>
      <ContactsPage {...pageProps} />
      <ContactsLedgerSyncIntroductionSheet
        {...pageProps.ledgerSyncIntroduction}
        {...ledgerSyncIntroductionSheet}
      />
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
  const ledgerSyncLineLeftUri = Image.resolveAssetSource(ledgerSyncLineLeftAsset).uri;
  const ledgerSyncLineRightUri = Image.resolveAssetSource(ledgerSyncLineRightAsset).uri;

  return (
    <QueuedDrawerBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onDismiss}
      testID="contacts-ledger-sync-introduction-drawer"
      enableDynamicSizing
    >
      <BottomSheetView>
        {isOpen ? (
          <Box lx={{ gap: "s24", paddingHorizontal: "s16", paddingBottom: "s24" }}>
            <BottomSheetHeader />
            <View testID="contacts-ledger-sync-introduction-artwork" style={styles.hero}>
              <SvgUri
                testID="contacts-ledger-sync-introduction-line-left"
                uri={ledgerSyncLineLeftUri}
                width={404.851}
                height={1}
                style={styles.leftLine}
                accessible={false}
              />
              <SvgUri
                testID="contacts-ledger-sync-introduction-line-right"
                uri={ledgerSyncLineRightUri}
                width={404.851}
                height={1}
                style={styles.rightLine}
                accessible={false}
              />
            </View>
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

const styles = StyleSheet.create({
  hero: {
    width: "100%",
    height: 200,
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "#1A1A1A",
  },
  leftLine: {
    position: "absolute",
    top: 40,
    left: -72,
    transform: [{ rotate: "150.4deg" }],
  },
  rightLine: {
    position: "absolute",
    top: 160,
    left: 20,
    transform: [{ scaleX: -1 }, { rotate: "-150.4deg" }],
  },
});
