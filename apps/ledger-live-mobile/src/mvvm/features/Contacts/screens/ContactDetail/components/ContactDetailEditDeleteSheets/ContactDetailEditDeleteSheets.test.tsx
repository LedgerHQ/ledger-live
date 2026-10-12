import React from "react";
import { Keyboard, Platform, View, type KeyboardEvent } from "react-native";
import { act, render, screen } from "@testing-library/react-native";
import type { ContactDetailEditDeleteFlowProps } from "../../hooks/useContactDetailEditDeleteAdapter";
import { ContactDetailEditDeleteSheets } from ".";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  QueuedBottomSheet: ({ footer }: { footer?: React.ReactNode }) => <>{footer}</>,
  useBottomSheetFooterInset: () => 0,
}));

jest.mock("@features/flow-contacts-edit-contact", () => ({
  ContactsRenameContactDrawer: () => null,
  ContactsRenameContactFooter: () => <View testID="contacts-rename-contact-confirm" />,
}));

jest.mock("@features/flow-contacts", () => ({
  ContactDetailActionsMenu: () => null,
  ContactsEditSignerMismatchDialog: () => null,
}));

jest.mock("@features/flow-contacts-delete-contact", () => ({
  ContactsDeleteContactDialog: () => null,
}));

const sheets = {
  actionsMenu: { isOpen: false, onClose: jest.fn() },
  renameDrawer: { isOpen: true },
  deleteDrawer: { isOpen: false, onCancel: jest.fn() },
  signerMismatchSheet: { isOpen: false, onCancel: jest.fn() },
} as unknown as ContactDetailEditDeleteFlowProps;

describe("ContactDetailEditDeleteSheets", () => {
  const originalOS = Platform.OS;
  const listeners = new Map<string, (event: KeyboardEvent) => void>();

  beforeEach(() => {
    listeners.clear();
    Platform.OS = "ios";
    jest.spyOn(Keyboard, "addListener").mockImplementation((event, listener) => {
      listeners.set(event, listener as (keyboardEvent: KeyboardEvent) => void);
      return { remove: jest.fn() } as unknown as ReturnType<typeof Keyboard.addListener>;
    });
  });

  afterEach(() => {
    Platform.OS = originalOS;
    jest.restoreAllMocks();
  });

  it("should lift the rename confirm above the iOS keyboard", () => {
    render(<ContactDetailEditDeleteSheets {...sheets} />);

    expect(footerLift()).toBeCloseTo(0);

    act(() => {
      listeners.get("keyboardWillShow")?.({
        endCoordinates: { height: 300, screenY: 500 },
      } as KeyboardEvent);
    });

    expect(footerLift()).toBe(-332);
  });

  it("should leave the rename confirm in place on Android", () => {
    Platform.OS = "android";
    render(<ContactDetailEditDeleteSheets {...sheets} />);

    act(() => {
      listeners.get("keyboardWillShow")?.({
        endCoordinates: { height: 300, screenY: 500 },
      } as KeyboardEvent);
    });

    expect(footerLift()).toBeCloseTo(0);
  });
});

function footerLift(): number {
  const lifted = screen.UNSAFE_getAllByType(View).find(view => view.props.style?.transform);
  return lifted?.props.style.transform[0].translateY;
}
