import React, { useState } from "react";
import { Platform } from "react-native";
import { BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import type { ContactsAddContactDrawerProps } from "@features/flow-contacts";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { ContactsAddContactDrawerSheet } from ".";

const mockUseKeyboardVisible = jest.fn();
const mockShouldUseKeyboardAvoidance = jest.fn();
const originalPlatform = Platform.OS;

jest.mock("~/logic/keyboardVisible", () => ({
  useKeyboardVisible: (...args: unknown[]) => mockUseKeyboardVisible(...args),
  shouldUseKeyboardAvoidance: (...args: unknown[]) => mockShouldUseKeyboardAvoidance(...args),
}));

function createViewModel(
  overrides: Partial<ContactsAddContactDrawerProps> = {},
): ContactsAddContactDrawerProps {
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
    onConfirm: jest.fn(),
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
    mockShouldUseKeyboardAvoidance.mockReturnValue(true);
  });

  afterEach(() => {
    Platform.OS = originalPlatform;
  });

  it("should render the name form with the Figma copy and character limit", () => {
    render(<ContactsAddContactDrawerSheet {...createViewModel()} />);

    expect(screen.getByText("Add contact")).toBeVisible();
    expect(screen.getByText(/For privacy, avoid full names and surnames/)).toBeVisible();
    expect(screen.getByText("0/32")).toBeVisible();
    expect(screen.getByRole("button", { name: "Confirm name" })).toBeDisabled();
    expect(screen.getByTestId("contacts-add-contact-name-input")).toHaveProp("autoFocus", true);
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
        {...createViewModel({ draftName: "Ada1", invalidNameError: "InvalidContactNameError" })}
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

  it("should pass the shared keyboard inset to the dynamic drawer", () => {
    mockUseKeyboardVisible.mockReturnValue({ isKeyboardVisible: true, keyboardHeight: 300 });

    render(<ContactsAddContactDrawerSheet {...createViewModel()} />);

    expect(screen.UNSAFE_getByType(BottomSheetView).props.style).toEqual({ paddingBottom: 324 });
  });

  it("should omit the keyboard inset when native resize handles the keyboard", () => {
    mockUseKeyboardVisible.mockReturnValue({ isKeyboardVisible: true, keyboardHeight: 300 });
    mockShouldUseKeyboardAvoidance.mockReturnValue(false);

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
