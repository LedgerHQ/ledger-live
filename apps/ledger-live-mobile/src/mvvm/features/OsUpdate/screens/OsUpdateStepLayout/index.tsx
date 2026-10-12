import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { OsUpdateNavBar } from "./OsUpdateNavBar";
import { OsUpdateStateSheet } from "../../sheets/OsUpdateStateSheet";

export type OsUpdateSheetSpec = Readonly<{
  content: React.ReactNode;
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
  return (
    <>
      <Box lx={{ flex: 1 }}>
        <OsUpdateNavBar onClose={onUserClose} />
        <Box lx={{ flex: 1 }}>{screen}</Box>
      </Box>
      {/* The queue shows one sheet at a time: this one yields to the confirmation and comes back. */}
      <OsUpdateStateSheet
        isOpen={sheet !== undefined && !isCloseConfirmationOpen}
        onClose={onUserClose}
      >
        {sheet?.content}
      </OsUpdateStateSheet>
    </>
  );
}
