import React from "react";
import { render as renderWithoutI18n, screen, userEvent } from "@testing-library/react-native";
import { ContactsI18nTestProvider } from "@features/platform-contacts/testing";
import { ContactIdSchema } from "@domain/entity-contact";
import { ContactsMeListItem } from "./ContactsMeListItem.native";

const render = (ui: React.ReactElement) =>
  renderWithoutI18n(ui, { wrapper: ContactsI18nTestProvider });

describe("ContactsMeListItem", () => {
  it("should render the Me avatar with the Figma size and border", () => {
    const contactId = ContactIdSchema.parse("contact-me");

    render(
      <ContactsMeListItem
        contact={{ contactId, name: "Me", isMe: true, initial: "M", addressCount: 1 }}
        addressCountLabel="1 address"
        onOpen={jest.fn()}
      />,
    );

    const avatar = screen.getByTestId("contacts-me-avatar");

    expect(avatar).toBeVisible();
    expect(avatar.props.size).toBe("md");
    expect(avatar.props.appearance).toBe("thin");
    expect(screen.getByTestId("contacts-me-name")).toHaveTextContent("My addresses (Me)");
    expect(avatar.props.alt).toBe("My addresses (Me)");
  });

  it("should open Me when its row is pressed", async () => {
    const contactId = ContactIdSchema.parse("contact-me");
    const onOpen = jest.fn();
    const user = userEvent.setup();

    render(
      <ContactsMeListItem
        contact={{ contactId, name: "Me", isMe: true, initial: "M", addressCount: 1 }}
        addressCountLabel="1 address"
        onOpen={onOpen}
      />,
    );

    await user.press(screen.getByTestId("contacts-me-item"));

    expect(onOpen).toHaveBeenCalledWith(contactId);
  });
});
