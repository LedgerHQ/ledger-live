import React from "react";
import { render, screen } from "@testing-library/react-native";
import { I18nTestProvider } from "@shared/i18n/testing";
import { ContactsAddContactContent, type ContactsAddContactContentProps } from "../..";

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

function createProps(
  overrides: Partial<ContactsAddContactContentProps> = {},
): ContactsAddContactContentProps {
  return {
    isConfirmEnabled: false,
    isSaving: false,
    draftName: "",
    avatarInitial: "",
    invalidNameError: null,
    onDraftNameChange: jest.fn(),
    onConfirm: jest.fn(async () => undefined),
    reset: jest.fn(),
    ...overrides,
  };
}

describe("ContactsAddContactContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the title, the name field and the naming disclaimer", () => {
    render(<ContactsAddContactContent {...createProps({ draftName: "Ada" })} />, {
      wrapper: I18nTestProvider,
    });

    expect(screen.getByTestId("contacts-add-contact-content")).toBeVisible();
    expect(screen.getByText("contacts.addContact")).toBeVisible();
    expect(screen.getByTestId("contacts-add-contact-name-input")).toHaveProp("value", "Ada");
    expect(screen.getByText("contacts.addContactDrawer.namingDisclaimer")).toBeVisible();
  });

  it("should leave the name field unfocused until the host asks for focus", () => {
    const { rerender } = render(<ContactsAddContactContent {...createProps()} />, {
      wrapper: I18nTestProvider,
    });

    expect(mockFocus).not.toHaveBeenCalled();

    rerender(<ContactsAddContactContent {...createProps({ autoFocus: true })} />);

    expect(mockFocus).toHaveBeenCalledTimes(1);
  });
});
