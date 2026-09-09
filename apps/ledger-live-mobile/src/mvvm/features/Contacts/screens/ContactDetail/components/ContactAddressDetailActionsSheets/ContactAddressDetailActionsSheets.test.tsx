import React from "react";
import {
  createInactiveContactAddressDetailActionsUiState,
  resolveContactAddressDetailActionsLabels,
} from "@features/flow-contacts";
import { ContactsRenameAddressDialog } from "@features/flow-contacts-edit-address";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { render, screen } from "@tests/test-renderer";
import type { ContactAddressDetailActionsFlowProps } from "LLM/features/Contacts";
import { ContactAddressDetailActionsSheets } from ".";

type SheetsProps = Pick<
  ContactAddressDetailActionsFlowProps,
  "deleteSheet" | "renameSheet" | "signerMismatchSheet"
>;

function createProps(isRenameOpen = true): SheetsProps {
  const uiState = createInactiveContactAddressDetailActionsUiState(
    resolveContactAddressDetailActionsLabels({ t: key => key }),
  );

  return {
    deleteSheet: uiState.delete,
    renameSheet: { ...uiState.rename, isOpen: isRenameOpen },
    signerMismatchSheet: uiState.signerMismatch,
  };
}

function renameSheetProps() {
  return screen
    .UNSAFE_getAllByType(QueuedBottomSheet)
    .find(sheet => sheet.props.testID === "contacts-rename-address-sheet")?.props;
}

describe("ContactAddressDetailActionsSheets", () => {
  // A content-sized sheet re-snaps while the keyboard animates in, so the edit address form is
  // pinned to a fixed height instead.
  it("should open the edit address form at its full height", () => {
    render(<ContactAddressDetailActionsSheets {...createProps()} />);

    expect(renameSheetProps()?.snapPoints).toBe("fullWithOffset");
    expect(renameSheetProps()?.enableDynamicSizing).toBeUndefined();
  });

  it("should raise the keyboard on the address form instead of waiting for a tap", () => {
    render(<ContactAddressDetailActionsSheets {...createProps()} />);

    expect(screen.UNSAFE_getByType(ContactsRenameAddressDialog).props.autoFocus).toBe(true);
  });
});
