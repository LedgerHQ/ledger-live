import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ContactIdSchema } from "@domain/entity-contact";
import { ContactAvatar } from "./ContactAvatar";

describe("ContactAvatar", () => {
  it("should render the Lumen avatar in the list", () => {
    const contactId = ContactIdSchema.parse("contact-elodie");

    render(<ContactAvatar contactId={contactId} name="élodie" />);

    const avatar = screen.getByTestId(`contacts-avatar-${contactId}`);

    expect(avatar).toBeVisible();
    expect(avatar.props.size).toBe("sm");
    expect(avatar.props.alt).toBe("élodie");
  });

  it("should render the Lumen avatar in the detail", () => {
    const contactId = ContactIdSchema.parse("contact-benoit");

    render(
      <ContactAvatar
        contactId={contactId}
        name="Benoit"
        size="xl"
        testID="contacts-detail-avatar"
      />,
    );

    const avatar = screen.getByTestId("contacts-detail-avatar");

    expect(avatar).toBeVisible();
    expect(avatar.props.size).toBe("xl");
    expect(avatar.props.alt).toBe("Benoit");
  });

  it("should pass the Me profile image to the Lumen avatar", () => {
    const contactId = ContactIdSchema.parse("contact-me");

    render(
      <ContactAvatar
        contactId={contactId}
        name="My Wallet"
        isMe
        src="https://example.com/me.png"
        size="xl"
        testID="contacts-detail-me-avatar"
      />,
    );

    const avatar = screen.getByTestId("contacts-detail-me-avatar");

    expect(avatar).toBeVisible();
    expect(avatar.props.size).toBe("xl");
    expect(avatar.props.src).toBe("https://example.com/me.png");
    expect(avatar.props.alt).toBe("My Wallet");
    expect(avatar.props.fallbackColor).toBeUndefined();
  });
});
