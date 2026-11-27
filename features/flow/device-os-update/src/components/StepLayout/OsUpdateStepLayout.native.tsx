import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OsUpdateNavBar } from "../NavBar/OsUpdateNavBar";
import { OsUpdateStateSheet } from "../sheets/OsUpdateStateSheet/OsUpdateStateSheet";

export type OsUpdateSheetSpec = Readonly<{
  content: React.ReactNode;
  hideHeader?: boolean;
}>;

export type OsUpdateStepLayoutSpec = Readonly<{
  screen?: React.ReactNode;
  sheet?: OsUpdateSheetSpec;
}>;

type OsUpdateStepLayoutProps = OsUpdateStepLayoutSpec &
  Readonly<{
    onUserClose: () => void;
    isCloseConfirmationOpen: boolean;
  }>;

/**
 * Renders the navigation bar and the full-screen state of a step and, over them, its bottom sheet
 * state.
 */
export function OsUpdateStepLayout({
  screen,
  sheet,
  onUserClose,
  isCloseConfirmationOpen,
}: OsUpdateStepLayoutProps) {
  const { top: topInset } = useSafeAreaInsets();

  return (
    <>
      <Box lx={{ flex: 1 }} style={{ paddingTop: topInset }} testID="os-update-step-layout">
        <OsUpdateNavBar onClose={onUserClose} />
        <Box lx={{ flex: 1 }}>{screen}</Box>
      </Box>
      {/* The queue shows one sheet at a time: this one yields to the confirmation and comes back. */}
      <OsUpdateStateSheet
        isOpen={sheet !== undefined && !isCloseConfirmationOpen}
        onClose={onUserClose}
        hideHeader={sheet?.hideHeader}
      >
        {sheet?.content}
      </OsUpdateStateSheet>
    </>
  );
}
