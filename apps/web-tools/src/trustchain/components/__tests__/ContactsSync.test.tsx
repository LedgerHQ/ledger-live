import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { contact, type Contact } from "@domain/entity-contact";
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

describe("ContactsSync", () => {
  it("lists contacts and creates a new contact", async () => {
    const user = userEvent.setup();
    const onCreate = jest.fn(() => createContact([me], "Alice"));

    render(<ContactsSync contacts={[me]} onCreate={onCreate} />);

    expect(screen.getByRole("listitem").textContent).toContain("Me");
    await user.type(screen.getByLabelText("Contact name"), "Alice");
    await user.click(screen.getByRole("button", { name: "Create contact" }));

    expect(onCreate).toHaveBeenCalledWith("Alice");
    expect(screen.getByText("Created Alice.")).not.toBeNull();
  });

  it("uses the domain validation for duplicate names", () => {
    const contacts: Contact[] = [me];

    expect(createContact(contacts, " me ")).toEqual({
      contact: null,
      validationError: "DuplicateContactNameError",
    });
  });
});
