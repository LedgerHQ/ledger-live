import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { ContactIdSchema } from "@domain/entity-contact";
import { ContactsMeListItem } from "./ContactsMeListItem.native";

describe("ContactsMeListItem", () => {
  it("should render the Me avatar with the Figma size and border", () => {
    const contactId = ContactIdSchema.parse("contact-me");

    render(
      <ContactsMeListItem
        contact={{ contactId, name: "Me", initial: "M", addressCount: 1 }}
        avatarSrc="https://example.com/avatar.png"
        addressCountLabel="1 address"
        onOpen={jest.fn()}
      />,
    );

    const avatar = screen.getByTestId("contacts-me-avatar");

    expect(avatar).toBeVisible();
    expect(avatar.props.size).toBe("md");
    expect(avatar.props.appearance).toBe("thin");
  });

  it("should open Me when its row is pressed", async () => {
    const contactId = ContactIdSchema.parse("contact-me");
    const onOpen = jest.fn();
    const user = userEvent.setup();

    render(
      <ContactsMeListItem
        contact={{ contactId, name: "Me", initial: "M", addressCount: 1 }}
        avatarSrc="https://example.com/avatar.png"
        addressCountLabel="1 address"
        onOpen={onOpen}
      />,
    );

    await user.press(screen.getByTestId("contacts-me-item"));

    expect(onOpen).toHaveBeenCalledWith(contactId);
  });
});
