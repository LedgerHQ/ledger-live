import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import {
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
} from "@domain/entity-contact";
import { I18nTestProvider } from "@shared/i18n/testing";
import { ContactsRenameContactDrawer } from ".";
import type { ContactsRenameContactDrawerProps } from "./types";

const i18nResources = {
  translation: {
    contacts: {
      editContact: {
        title: "Edit contact",
        namePlaceholder: "Contact name",
        namingDisclaimer: "Use a nickname or a first name and initial.",
        confirmName: "Apply changes",
        applyChanges: "Apply changes",
        invalidNameError: "Special characters are not allowed.",
      },
      addContactDrawer: {
        duplicateNameError: "This contact name is already in use.",
      },
    },
  },
};

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
    onOpen: jest.fn(),
    onClose: jest.fn(),
    onDraftNameChange: jest.fn(),
    onConfirm: jest.fn(async () => undefined),
    ...overrides,
  };
}

function renderDrawer(props: ContactsRenameContactDrawerProps) {
  return render(
    <I18nTestProvider resources={i18nResources}>
      <ContactsRenameContactDrawer {...props} />
    </I18nTestProvider>,
  );
}

describe("ContactsRenameContactDrawer", () => {
  it("should render the validation state and account for drawer insets", () => {
    const { toJSON } = renderDrawer(
      createViewModel({
        draftName: "Ada",
        invalidNameError: INVALID_CONTACT_NAME_ERROR_NAME,
        bottomInset: 8,
        keyboardInset: 300,
      }),
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

    renderDrawer(
      createViewModel({
        isConfirmEnabled: true,
        onDraftNameChange,
        onConfirm,
      }),
    );

    fireEvent.changeText(screen.getByTestId("contacts-rename-contact-name-input"), "Ada Lovelace");
    fireEvent.press(screen.getByTestId("contacts-rename-contact-confirm"));

    expect(onDraftNameChange).toHaveBeenCalledWith("Ada Lovelace");
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should withhold focus until the host grants it", () => {
    const { rerender } = renderDrawer(createViewModel());

    expect(mockFocus).not.toHaveBeenCalled();

    rerender(
      <I18nTestProvider resources={i18nResources}>
        <ContactsRenameContactDrawer {...createViewModel({ autoFocus: true })} />
      </I18nTestProvider>,
    );

    expect(mockFocus).toHaveBeenCalledTimes(1);
  });

  it("should not render its content while closed", () => {
    renderDrawer(createViewModel({ isOpen: false }));

    expect(screen.queryByTestId("contacts-rename-contact-content")).not.toBeOnTheScreen();
  });
});
