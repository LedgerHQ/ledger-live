import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
} from "@domain/entity-contact";
import { ContactsAddContactContent } from "../..";
import type { ContactsAddContactContentProps } from "./types";

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
    labels: {
      title: "Add contact",
      namePlaceholder: "Contact name",
      namingDisclaimer:
        "For privacy, avoid full names and surnames. Use a nickname or just a first name + initial, e.g. 'John S'.",
      confirmName: "Add contact",
      nameValidationErrors: {
        [INVALID_CONTACT_NAME_ERROR_NAME]: "Special characters are not allowed.",
        [DUPLICATE_CONTACT_NAME_ERROR_NAME]: "This contact name is already in use.",
      },
    },
    onDraftNameChange: jest.fn(),
    onConfirm: jest.fn(async () => undefined),
    reset: jest.fn(),
    ...overrides,
  };
}

describe("ContactsAddContactContent", () => {
  it("should render embeddable form content without a dialog", () => {
    render(<ContactsAddContactContent {...createProps()} />);

    expect(screen.getByText(/For privacy, avoid full names and surnames/)).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should generate distinct naming disclaimer ids for each embedded form", () => {
    render(
      <>
        <ContactsAddContactContent {...createProps()} />
        <ContactsAddContactContent {...createProps()} />
      </>,
    );

    const disclaimerIds = screen
      .getAllByText(/For privacy, avoid full names and surnames/)
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
    );

    expect(screen.getByTestId("contacts-add-contact-name-input")).toHaveValue("Cédric");
    expect(screen.getByTestId("contacts-add-contact-name-input")).toHaveAttribute(
      "helpertext",
      "Special characters are not allowed.",
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
    );

    expect(screen.getByTestId("contacts-add-contact-name-input")).toHaveAttribute("readonly");
  });
});
