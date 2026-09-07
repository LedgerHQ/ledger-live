import React, { useState } from "react";
import { Platform } from "react-native";
import { BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import type { AddContactAppAdapterResult } from "@features/flow-contacts";
import { ContactsAddContactContent } from "@features/flow-contacts-add-contact";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { act, fireEvent, render, screen } from "@tests/test-renderer";
import { ContactsAddContactDrawerSheet } from ".";

const mockUseKeyboardVisible = jest.fn();
const originalPlatform = Platform.OS;
const originalVersion = Object.getOwnPropertyDescriptor(Platform, "Version");

jest.mock("~/logic/keyboardVisible", () => {
  const actual =
    jest.requireActual<typeof import("~/logic/keyboardVisible")>("~/logic/keyboardVisible");

  return {
    ...actual,
    useKeyboardVisible: (...args: unknown[]) => mockUseKeyboardVisible(...args),
  };
});

function createViewModel(
  overrides: Partial<AddContactAppAdapterResult> = {},
): AddContactAppAdapterResult {
  return {
    isOpen: true,
    isConfirmEnabled: false,
    isSaving: false,
    draftName: "",
    avatarInitial: "",
    invalidNameError: null,
    labels: {
      title: "Add contact",
      namePlaceholder: "Contact name",
      namingDisclaimer:
        "For privacy, avoid full names and surnames. Use a nickname or just a first name + initial, e.g. 'John S'.",
      confirmName: "Confirm name",
      nameValidationErrors: {
        InvalidContactNameError: "Special characters are not allowed.",
        DuplicateContactNameError: "This contact name is already in use.",
      },
    },
    onOpen: jest.fn(),
    onClose: jest.fn(),
    onDraftNameChange: jest.fn(),
    onConfirm: jest.fn(async () => undefined),
    reset: jest.fn(),
    ...overrides,
  };
}

function ControlledAddContactDrawerSheet() {
  const [draftName, setDraftName] = useState("");

  return (
    <ContactsAddContactDrawerSheet
      {...createViewModel({
        draftName,
        isConfirmEnabled: true,
        onDraftNameChange: setDraftName,
      })}
    />
  );
}

describe("ContactsAddContactDrawerSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseKeyboardVisible.mockReturnValue({ isKeyboardVisible: false, keyboardHeight: 0 });
  });

  afterEach(() => {
    Platform.OS = originalPlatform;
    if (originalVersion) {
      Object.defineProperty(Platform, "Version", originalVersion);
    }
  });

  it("should render the name form with the Figma copy and character limit", () => {
    render(<ContactsAddContactDrawerSheet {...createViewModel()} />);

    expect(screen.getByText("Add contact")).toBeVisible();
    expect(screen.getByText(/For privacy, avoid full names and surnames/)).toBeVisible();
    expect(screen.getByText("0/32")).toBeVisible();
    expect(screen.getByRole("button", { name: "Confirm name" })).toBeDisabled();
  });

  it("should hold the name field focus back until the drawer has finished opening", () => {
    render(<ContactsAddContactDrawerSheet {...createViewModel()} />);

    expect(screen.UNSAFE_getByType(ContactsAddContactContent).props.autoFocus).toBe(false);

    act(() => screen.UNSAFE_getByType(QueuedBottomSheet).props.onOpened());

    expect(screen.UNSAFE_getByType(ContactsAddContactContent).props.autoFocus).toBe(true);
  });

  it("should cap the contact name at 32 characters", async () => {
    const { user } = render(<ControlledAddContactDrawerSheet />);
    const name = "a".repeat(33);

    await user.type(screen.getByTestId("contacts-add-contact-name-input"), name);

    expect(screen.getByTestId("contacts-add-contact-name-input")).toHaveProp(
      "value",
      "a".repeat(32),
    );
    expect(screen.getByText("32/32")).toBeVisible();
    expect(screen.getByTestId("contacts-add-contact-name-count")).toHaveProp(
      "accessibilityLiveRegion",
      "polite",
    );
    expect(screen.getByRole("button", { name: "Confirm name" })).toBeEnabled();
  });

  it("should render the shared validation error and disable confirmation", () => {
    render(
      <ContactsAddContactDrawerSheet
        {...createViewModel({ draftName: "Ada@1", invalidNameError: "InvalidContactNameError" })}
      />,
    );

    expect(screen.getByPlaceholderText("Contact name")).toBeVisible();
    expect(screen.getByText("Special characters are not allowed.")).toBeVisible();
    expect(screen.getByTestId("contacts-add-contact-name-error")).toHaveProp(
      "accessibilityLiveRegion",
      "polite",
    );
    expect(screen.getByRole("button", { name: "Confirm name" })).toBeDisabled();
  });

  it("should make the name input non-editable while saving", () => {
    render(<ContactsAddContactDrawerSheet {...createViewModel({ isSaving: true })} />);

    expect(screen.getByTestId("contacts-add-contact-name-input")).toHaveProp("editable", false);
  });

  it("should expose the edited name, enable confirmation, and close the drawer", async () => {
    const onClose = jest.fn();
    const onDraftNameChange = jest.fn();
    const onConfirm = jest.fn();
    const { rerender, user } = render(
      <ContactsAddContactDrawerSheet
        {...createViewModel({ onClose, onDraftNameChange, onConfirm })}
      />,
    );

    fireEvent.changeText(screen.getByTestId("contacts-add-contact-name-input"), "Ada");
    expect(onDraftNameChange).toHaveBeenCalledWith("Ada");

    rerender(
      <ContactsAddContactDrawerSheet
        {...createViewModel({
          draftName: "Ada",
          isConfirmEnabled: true,
          onClose,
          onDraftNameChange,
          onConfirm,
        })}
      />,
    );

    expect(screen.getByText("3/32")).toBeVisible();
    expect(screen.getByRole("button", { name: "Confirm name" })).toBeEnabled();

    await user.press(screen.getByTestId("bottom-sheet-header-close-button"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should clear the keyboard by the same gap the other contact drawers leave on iOS", () => {
    Platform.OS = "ios";
    mockUseKeyboardVisible.mockReturnValue({ isKeyboardVisible: true, keyboardHeight: 300 });

    render(<ContactsAddContactDrawerSheet {...createViewModel()} />);

    expect(screen.UNSAFE_getByType(BottomSheetView).props.style).toEqual({ paddingBottom: 356 });
  });

  it("should pass the shared keyboard inset without the iOS gap on Android", () => {
    Platform.OS = "android";
    Object.defineProperty(Platform, "Version", { value: 35 });
    mockUseKeyboardVisible.mockReturnValue({ isKeyboardVisible: true, keyboardHeight: 300 });

    render(<ContactsAddContactDrawerSheet {...createViewModel()} />);

    expect(screen.UNSAFE_getByType(BottomSheetView).props.style).toEqual({ paddingBottom: 324 });
  });

  it("should reserve no keyboard room while the keyboard is hidden", () => {
    mockUseKeyboardVisible.mockReturnValue({ isKeyboardVisible: false, keyboardHeight: 0 });

    render(<ContactsAddContactDrawerSheet {...createViewModel()} />);

    expect(screen.UNSAFE_getByType(BottomSheetView).props.style).toEqual({ paddingBottom: 24 });
  });

  it("should omit the keyboard inset when native resize handles the keyboard", () => {
    Platform.OS = "android";
    Object.defineProperty(Platform, "Version", { value: 34 });
    mockUseKeyboardVisible.mockReturnValue({ isKeyboardVisible: true, keyboardHeight: 300 });

    render(<ContactsAddContactDrawerSheet {...createViewModel()} />);

    expect(screen.UNSAFE_getByType(BottomSheetView).props.style).toEqual({ paddingBottom: 24 });
  });

  it("should use will events on iOS", () => {
    Platform.OS = "ios";

    render(<ContactsAddContactDrawerSheet {...createViewModel()} />);

    expect(mockUseKeyboardVisible).toHaveBeenCalledWith({ eventTiming: "will" });
  });

  it("should use did events on Android", () => {
    Platform.OS = "android";

    render(<ContactsAddContactDrawerSheet {...createViewModel()} />);

    expect(mockUseKeyboardVisible).toHaveBeenCalledWith({ eventTiming: "did" });
  });
});
