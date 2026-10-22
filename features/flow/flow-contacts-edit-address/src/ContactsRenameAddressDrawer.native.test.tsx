import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import {
  ContactAddressValueSchema,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
} from "@domain/entity-contact";
import { I18nTestProvider } from "@shared/i18n/testing";
import { ContactsRenameAddressDialog } from ".";
import type { ContactsRenameAddressDrawerProps } from "./types";

const mockFocus = jest.fn();

// The Lumen passthrough renders host elements whose refs stay null, so the focus call is
// unobservable. Override just TextInput to expose a controllable imperative handle.
jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const actual = jest.requireActual<Record<string, unknown>>("@ledgerhq/lumen-ui-rnative");
  const ReactActual = jest.requireActual<typeof import("react")>("react");

  return new Proxy(actual, {
    get(target, prop) {
      if (prop !== "TextInput") {
        return target[prop as string];
      }

      return ({ ref, ...props }: { ref?: React.Ref<{ focus: () => void }> }) => {
        ReactActual.useImperativeHandle(ref, () => ({ focus: mockFocus }));
        return ReactActual.createElement("TextInput", props);
      };
    },
  });
});

function createViewModel(
  overrides: Partial<ContactsRenameAddressDrawerProps> = {},
): ContactsRenameAddressDrawerProps {
  const address = ContactAddressValueSchema.parse("0x1234567890123456789012345678901234567890");

  return {
    isOpen: true,
    isConfirmEnabled: false,
    isSaving: false,
    draftLabel: "",
    invalidLabelError: null,
    addressEntry: {
      status: "valid",
      value: address,
      resolvedAddress: address,
      inputMethod: "manual",
    },
    isDeviceRequired: true,
    supportsDomain: true,
    onOpen: jest.fn(),
    onClose: jest.fn(),
    onDraftLabelChange: jest.fn(),
    onAddressChange: jest.fn(),
    onConfirm: jest.fn(async () => undefined),
    ...overrides,
  };
}

describe("ContactsRenameAddressDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the validation state while open", () => {
    render(
      <ContactsRenameAddressDialog
        {...createViewModel({
          draftLabel: "Treasury",
          invalidLabelError: INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
        })}
      />,
      { wrapper: I18nTestProvider },
    );

    expect(screen.getByTestId("contacts-rename-address-input")).toBeVisible();
    expect(screen.getByTestId("contacts-rename-address-confirm")).toHaveProp("disabled", true);
  });

  it("should forward address label and confirmation actions", () => {
    const onDraftLabelChange = jest.fn();
    const onConfirm = jest.fn(async () => undefined);

    render(
      <ContactsRenameAddressDialog
        {...createViewModel({
          isConfirmEnabled: true,
          onDraftLabelChange,
          onConfirm,
        })}
      />,
      { wrapper: I18nTestProvider },
    );

    fireEvent.changeText(screen.getByTestId("contacts-rename-address-input"), "Treasury");
    fireEvent.press(screen.getByTestId("contacts-rename-address-confirm"));

    expect(onDraftLabelChange).toHaveBeenCalledWith("Treasury");
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should not render its content while closed", () => {
    render(<ContactsRenameAddressDialog {...createViewModel({ isOpen: false })} />, {
      wrapper: I18nTestProvider,
    });

    expect(screen.queryByText("contacts.editAddress.title")).not.toBeOnTheScreen();
  });

  it("should clear the on-screen navigation area below the form", () => {
    const { toJSON } = render(
      <ContactsRenameAddressDialog {...createViewModel({ bottomInset: 8 })} />,
      { wrapper: I18nTestProvider },
    );

    expect(toJSON()).toMatchObject({ props: { style: { paddingBottom: 32 } } });
  });

  it("should raise the keyboard on the address field when the host asks for focus", () => {
    render(<ContactsRenameAddressDialog {...createViewModel({ autoFocus: true })} />, {
      wrapper: I18nTestProvider,
    });

    expect(mockFocus).toHaveBeenCalledTimes(1);
  });

  it("should leave the field unfocused unless the host asks for focus", () => {
    render(<ContactsRenameAddressDialog {...createViewModel()} />, {
      wrapper: I18nTestProvider,
    });

    expect(mockFocus).not.toHaveBeenCalled();
  });

  // Without this the enclosing sheet never learns it raised the keyboard, and the sheet closing
  // behind it retracts it again.
  it("should register both fields with the enclosing sheet", () => {
    render(<ContactsRenameAddressDialog {...createViewModel()} />, {
      wrapper: I18nTestProvider,
    });

    expect(screen.getByTestId("contacts-edit-address-input")).toHaveProp("onFocus");
    expect(screen.getByTestId("contacts-rename-address-input")).toHaveProp("onFocus");
  });
});
