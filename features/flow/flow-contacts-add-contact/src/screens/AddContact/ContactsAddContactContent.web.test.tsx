import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { INVALID_CONTACT_NAME_ERROR_NAME } from "@domain/entity-contact";
import { I18nTestProvider } from "@shared/i18n/testing";
import { ContactsAddContactContent, type ContactsAddContactContentProps } from "../..";

jest.mock("@features/platform-contacts", () => ({
  ...jest.requireActual("@features/platform-contacts"),
  getContactInitial: (name: string) => name.slice(0, 1),
}));

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
  it("should render embeddable form content without a dialog", () => {
    render(<ContactsAddContactContent {...createProps()} />, { wrapper: I18nTestProvider });

    expect(screen.getByText("contacts.addContactDrawer.namingDisclaimer")).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should generate distinct naming disclaimer ids for each embedded form", () => {
    render(
      <>
        <ContactsAddContactContent {...createProps()} />
        <ContactsAddContactContent {...createProps()} />
      </>,
      { wrapper: I18nTestProvider },
    );

    const disclaimerIds = screen
      .getAllByText("contacts.addContactDrawer.namingDisclaimer")
      .map(disclaimer => disclaimer.parentElement?.id);

    expect(new Set(disclaimerIds).size).toBe(2);
  });

  it("should render the shared validation error and disable confirmation", () => {
    render(
      <ContactsAddContactContent
        {...createProps({
          draftName: "Cédric",
          invalidNameError: INVALID_CONTACT_NAME_ERROR_NAME,
        })}
      />,
      { wrapper: I18nTestProvider },
    );

    expect(screen.getByTestId("contacts-add-contact-name-input")).toHaveValue("Cédric");
    expect(screen.getByTestId("contacts-add-contact-name-input")).toHaveAttribute(
      "helpertext",
      "contacts.addContactDrawer.invalidNameError",
    );
    expect(screen.getByTestId("contacts-add-contact-save")).toBeDisabled();
  });

  it("should forward draft name changes and submissions to the embedding consumer", async () => {
    const onDraftNameChange = jest.fn();
    const onConfirm = jest.fn(async () => undefined);

    render(
      <ContactsAddContactContent
        {...createProps({
          draftName: "Ada",
          isConfirmEnabled: true,
          onDraftNameChange,
          onConfirm,
        })}
      />,
      { wrapper: I18nTestProvider },
    );

    fireEvent.change(screen.getByTestId("contacts-add-contact-name-input"), {
      target: { value: "Ada1" },
    });
    fireEvent.click(screen.getByTestId("contacts-add-contact-save"));

    expect(onDraftNameChange).toHaveBeenCalledWith("Ada1");
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should make the draft name read-only while saving", () => {
    render(
      <ContactsAddContactContent
        {...createProps({
          draftName: "Ada",
          isSaving: true,
        })}
      />,
      { wrapper: I18nTestProvider },
    );

    expect(screen.getByTestId("contacts-add-contact-name-input")).toHaveAttribute("readonly");
  });
});
