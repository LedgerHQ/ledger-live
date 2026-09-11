import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { contact, contactAddress, type Contact } from "@domain/entity-contact";
import { ContactsSync, createContact } from "../ContactsSync";

jest.mock("@ledgerhq/lumen-ui-react", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    Button: ({ children, ...props }: React.ComponentProps<"button">) =>
      React.createElement("button", props, children),
    TextInput: ({ label, ...props }: React.ComponentProps<"input"> & { label: string }) =>
      React.createElement(
        "label",
        null,
        label,
        React.createElement("input", { ...props, "aria-label": label }),
      ),
  };
});

const me = contact({
  id: "00000000-0000-4000-8000-000000000001",
  isMe: true,
  name: "Me",
  addresses: [],
});

const alice = contact({
  id: "00000000-0000-4000-8000-000000000002",
  isMe: false,
  name: "Alice",
  deviceCredentials: {
    groupHandle: "group-handle",
    hmacProof: "contact-proof",
  },
  addresses: [
    contactAddress({
      id: "address-ethereum",
      currencyId: "ethereum",
      label: "Ethereum",
      address: "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
      device: {
        blockchainFamily: "ethereum",
        chainId: "1",
        hmacRest: "proof",
      },
    }),
  ],
});

describe("ContactsSync", () => {
  it("should list contacts and report a successful creation", async () => {
    const user = userEvent.setup();
    const onCreate = jest.fn(() => createContact([me], "Alice"));

    render(<ContactsSync contacts={[me]} onCreate={onCreate} />);

    expect(screen.getByRole("listitem").textContent).toContain("Me");
    await user.type(screen.getByLabelText("Contact name"), "Alice");
    await user.click(screen.getByRole("button", { name: "Create contact" }));

    expect(onCreate).toHaveBeenCalledWith("Alice");
    expect(screen.getByText("Created Alice.")).not.toBeNull();
  });

  it("should use the singular address label for one address", () => {
    render(<ContactsSync contacts={[me, alice]} onCreate={jest.fn()} />);

    expect(screen.getByText("1 address")).not.toBeNull();
  });

  it("should report an error when submitting an empty name", async () => {
    const user = userEvent.setup();
    const onCreate = jest.fn((draftName: string) => createContact([me], draftName));

    render(<ContactsSync contacts={[me]} onCreate={onCreate} />);

    await user.click(screen.getByRole("button", { name: "Create contact" }));

    expect(onCreate).toHaveBeenCalledWith("");
    expect(screen.getByRole("alert").textContent).toBe("Enter a valid contact name.");
  });

  it("should reject whitespace-only names without throwing", () => {
    expect(createContact([me], "   ")).toEqual({
      contact: null,
      validationError: "InvalidContactNameError",
    });
  });

  it("should use the domain validation for duplicate names", () => {
    const contacts: Contact[] = [me];

    expect(createContact(contacts, " me ")).toEqual({
      contact: null,
      validationError: "DuplicateContactNameError",
    });
  });
});
