import React from "react";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { NetworkHelpPanel } from "@features/flow-receive";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import { useTranslation } from "~/context/Locale";
import type { NetworkHelp } from "../hooks/useNetworkHelp";

const CONTENT_BOTTOM_SPACING = 16;

type NetworkHelpSheetProps = Readonly<{
  networkHelp: NetworkHelp;
}>;

function NetworkHelpSheetContent() {
  const { t } = useTranslation();
  const bottomInset = useBottomSheetBottomInset();

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + CONTENT_BOTTOM_SPACING }}>
      <BottomSheetHeader density="expanded" title={t("receiveAddress.networkHelp.title")} />
      <NetworkHelpPanel />
    </BottomSheetView>
  );
}

/** "How to select the network?", in place of the drawer, which comes back once it closes. */
export function NetworkHelpSheet({ networkHelp }: NetworkHelpSheetProps) {
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={networkHelp.isOpen}
      onClose={networkHelp.close}
      enableDynamicSizing
      contentHasBottomSpace
      testID="modular-drawer-network-help-sheet"
    >
      <NetworkHelpSheetContent />
    </QueuedBottomSheet>
  );
}
