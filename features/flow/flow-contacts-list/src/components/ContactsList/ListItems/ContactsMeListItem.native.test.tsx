import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ContactIdSchema } from "@domain/entity-contact";
import { ContactsMeListItem } from "./ContactsMeListItem.native";

describe("ContactsMeListItem", () => {
  it("should render a 48px avatar for Me", () => {
    const contactId = ContactIdSchema.parse("contact-me");

    render(
      <ContactsMeListItem
        contact={{ contactId, name: "Me", initial: "M", addressCount: 1 }}
        avatarSrc="https://example.com/avatar.png"
        addressCountLabel="1 address"
        onOpen={jest.fn()}
      />,
    );

    expect(screen.getByTestId("contacts-me-avatar").props.size).toBe("md");
  });

  it("should open Me when its row is pressed", () => {
    const contactId = ContactIdSchema.parse("contact-me");
    const onOpen = jest.fn();

    render(
      <ContactsMeListItem
        contact={{ contactId, name: "Me", initial: "M", addressCount: 1 }}
        avatarSrc="https://example.com/avatar.png"
        addressCountLabel="1 address"
        onOpen={onOpen}
      />,
    );

    fireEvent.press(screen.getByTestId("contacts-me-item"));

    expect(onOpen).toHaveBeenCalledWith(contactId);
  });
});
