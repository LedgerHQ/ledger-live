import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { ContactIdSchema } from "@domain/entity-contact";
import { ContactsSavedContactListItem } from "./ContactsSavedContactListItem.native";

describe("ContactsSavedContactListItem", () => {
  it("should render a 48px avatar for a saved contact", () => {
    const contactId = ContactIdSchema.parse("contact-ada");

    render(
      <ContactsSavedContactListItem
        contact={{ contactId, name: "Ada", initial: "A", addressCount: 2 }}
        addressCountLabel="2 addresses"
        onOpen={jest.fn()}
      />,
    );

    expect(screen.getByTestId(`contacts-avatar-${contactId}`).props.size).toBe("md");
  });

  it("should open the saved contact when its row is pressed", async () => {
    const contactId = ContactIdSchema.parse("contact-ada");
    const onOpen = jest.fn();
    const user = userEvent.setup();

    render(
      <ContactsSavedContactListItem
        contact={{ contactId, name: "Ada", initial: "A", addressCount: 2 }}
        addressCountLabel="2 addresses"
        onOpen={onOpen}
      />,
    );

    await user.press(screen.getByTestId(`contacts-saved-contact-${contactId}`));

    expect(onOpen).toHaveBeenCalledWith(contactId);
  });
});
