import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import {
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
} from "@domain/entity-contact";
import { ContactsRenameContactDrawer } from ".";
import type { ContactsRenameContactDrawerProps } from "./types";

const mockFocus = jest.fn();

// The shared Lumen passthrough renders host elements whose refs stay null, so the focus call is
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
  overrides: Partial<ContactsRenameContactDrawerProps> = {},
): ContactsRenameContactDrawerProps {
  return {
    isOpen: true,
    isConfirmEnabled: false,
    isSaving: false,
    draftName: "",
    invalidNameError: null,
    isDeviceRequired: false,
    labels: {
      title: "Edit contact",
      namePlaceholder: "Contact name",
      namingDisclaimer: "Use a nickname or a first name and initial.",
      applyChanges: "Apply changes",
      confirmName: "Apply changes",
      nameValidationErrors: {
        [INVALID_CONTACT_NAME_ERROR_NAME]: "Special characters are not allowed.",
        [DUPLICATE_CONTACT_NAME_ERROR_NAME]: "This contact name is already in use.",
      },
    },
    onOpen: jest.fn(),
    onClose: jest.fn(),
    onDraftNameChange: jest.fn(),
    onConfirm: jest.fn(async () => undefined),
    ...overrides,
  };
}

describe("ContactsRenameContactDrawer", () => {
  it("should render the validation state and account for drawer insets", () => {
    const { toJSON } = render(
      <ContactsRenameContactDrawer
        {...createViewModel({
          draftName: "Ada",
          invalidNameError: INVALID_CONTACT_NAME_ERROR_NAME,
          bottomInset: 8,
          keyboardInset: 300,
        })}
      />,
    );

    expect(screen.getByTestId("contacts-rename-contact-content")).toBeVisible();
    expect(screen.getByText("Edit contact")).toBeVisible();
    expect(screen.getByTestId("contacts-rename-contact-name-input")).toHaveProp("value", "Ada");
    expect(screen.getByTestId("contacts-rename-contact-name-error")).toHaveProp(
      "accessibilityLiveRegion",
      "polite",
    );
    expect(screen.getByText("Special characters are not allowed.")).toBeVisible();
    expect(screen.getByText("3/32")).toBeVisible();
    expect(screen.getByTestId("contacts-rename-contact-confirm")).toHaveProp("disabled", true);
    expect(toJSON()).toMatchObject({ props: { style: { paddingBottom: 332 } } });
  });

  it("should forward name and confirmation actions", () => {
    const onDraftNameChange = jest.fn();
    const onConfirm = jest.fn(async () => undefined);

    render(
      <ContactsRenameContactDrawer
        {...createViewModel({
          isConfirmEnabled: true,
          onDraftNameChange,
          onConfirm,
        })}
      />,
    );

    fireEvent.changeText(screen.getByTestId("contacts-rename-contact-name-input"), "Ada Lovelace");
    fireEvent.press(screen.getByTestId("contacts-rename-contact-confirm"));

    expect(onDraftNameChange).toHaveBeenCalledWith("Ada Lovelace");
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should withhold focus until the host grants it", () => {
    const { rerender } = render(<ContactsRenameContactDrawer {...createViewModel()} />);

    expect(mockFocus).not.toHaveBeenCalled();

    rerender(<ContactsRenameContactDrawer {...createViewModel({ autoFocus: true })} />);

    expect(mockFocus).toHaveBeenCalledTimes(1);
  });

  it("should not render its content while closed", () => {
    render(<ContactsRenameContactDrawer {...createViewModel({ isOpen: false })} />);

    expect(screen.queryByTestId("contacts-rename-contact-content")).not.toBeOnTheScreen();
  });
});
