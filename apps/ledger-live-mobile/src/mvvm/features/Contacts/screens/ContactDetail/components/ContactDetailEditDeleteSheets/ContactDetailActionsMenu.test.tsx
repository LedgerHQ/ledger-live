import React from "react";
import type { ReactTestInstance } from "react-test-renderer";
import { ledgerLiveThemes } from "@ledgerhq/lumen-design-core";
import { ContactDetailActionsMenu } from "@features/flow-contacts";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { render, screen } from "@tests/test-renderer";

// The flow package stubs Lumen in its own Jest setup, so the icon colors the design system
// resolves at render time can only be asserted from the app.
const theme = ledgerLiveThemes.dark;

function iconColor(testID: string): unknown {
  const [group] = screen
    .getByTestId(testID)
    .findAll((node: ReactTestInstance) => String(node.type) === "RNSVGGroup");
  return group?.props.color;
}

describe("ContactDetailActionsMenu", () => {
  beforeEach(() => {
    render(
      <QueuedBottomSheet isRequestingToBeOpened onClose={jest.fn()} enableDynamicSizing>
        <ContactDetailActionsMenu
          isOpen
          canDelete
          labels={{ editContact: "Edit name", deleteContact: "Delete contact" }}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
        />
      </QueuedBottomSheet>,
    );
  });

  it("should render the delete action with a destructive trash icon", () => {
    expect(iconColor("contacts-detail-delete-action")).toBe(theme.colors.text.error);
  });

  it("should keep the edit action icon neutral", () => {
    expect(iconColor("contacts-detail-edit-action")).toBe(theme.colors.text.base);
  });
});
