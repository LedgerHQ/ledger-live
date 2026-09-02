import React from "react";
import { Platform } from "react-native";
import { BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import {
  createInactiveContactAddressDetailActionsUiState,
  resolveContactAddressDetailActionsLabels,
} from "@features/flow-contacts";
import { render, screen } from "@tests/test-renderer";
import type { ContactAddressDetailActionsFlowProps } from "LLM/features/Contacts";
import { ContactAddressDetailActionsSheets } from ".";

const mockUseKeyboardVisible = jest.fn();
const mockShouldUseKeyboardAvoidance = jest.fn();
const originalPlatform = Platform.OS;

jest.mock("~/logic/keyboardVisible", () => ({
  useKeyboardVisible: (...args: unknown[]) => mockUseKeyboardVisible(...args),
  shouldUseKeyboardAvoidance: (...args: unknown[]) => mockShouldUseKeyboardAvoidance(...args),
}));

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

function renameSheetPaddings(): unknown[] {
  return screen.UNSAFE_getAllByType(BottomSheetView).map(view => view.props.style?.paddingBottom);
}

describe("ContactAddressDetailActionsSheets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseKeyboardVisible.mockReturnValue({ isKeyboardVisible: false, keyboardHeight: 0 });
    mockShouldUseKeyboardAvoidance.mockReturnValue(true);
  });

  afterEach(() => {
    Platform.OS = originalPlatform;
  });

  it("should keep the edit address form above the keyboard", () => {
    Platform.OS = "android";
    mockUseKeyboardVisible.mockReturnValue({ isKeyboardVisible: true, keyboardHeight: 300 });

    render(<ContactAddressDetailActionsSheets {...createProps()} />);

    expect(renameSheetPaddings()).toContain(324);
  });

  it("should add an extra gap above the keyboard on iOS", () => {
    Platform.OS = "ios";
    mockUseKeyboardVisible.mockReturnValue({ isKeyboardVisible: true, keyboardHeight: 300 });

    render(<ContactAddressDetailActionsSheets {...createProps()} />);

    expect(renameSheetPaddings()).toContain(356);
  });

  it("should omit the keyboard inset when native resize handles the keyboard", () => {
    Platform.OS = "android";
    mockUseKeyboardVisible.mockReturnValue({ isKeyboardVisible: true, keyboardHeight: 300 });
    mockShouldUseKeyboardAvoidance.mockReturnValue(false);

    render(<ContactAddressDetailActionsSheets {...createProps()} />);

    expect(renameSheetPaddings()).not.toContain(324);
  });

  it("should use will events on iOS", () => {
    Platform.OS = "ios";

    render(<ContactAddressDetailActionsSheets {...createProps()} />);

    expect(mockUseKeyboardVisible).toHaveBeenCalledWith({ eventTiming: "will" });
  });

  it("should use did events on Android", () => {
    Platform.OS = "android";

    render(<ContactAddressDetailActionsSheets {...createProps()} />);

    expect(mockUseKeyboardVisible).toHaveBeenCalledWith({ eventTiming: "did" });
  });
});
