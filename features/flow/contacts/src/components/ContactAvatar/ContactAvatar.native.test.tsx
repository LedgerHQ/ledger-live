import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ContactIdSchema } from "@domain/entity-contact";
import { ContactAvatar } from "./ContactAvatar.native";
import { resolveAvatarColor } from "./resolveAvatarColor";

describe("ContactAvatar", () => {
  it("should pass the contact details to the Lumen avatar in the list", () => {
    const contactId = ContactIdSchema.parse("contact-elodie");

    render(<ContactAvatar contactId={contactId} name="élodie" />);

    const avatar = screen.getByTestId(`contacts-avatar-${contactId}`);

    expect(avatar).toBeVisible();
    expect(avatar.props).toMatchObject({
      size: "sm",
      alt: "élodie",
      lx: { backgroundColor: resolveAvatarColor(contactId) },
    });
  });

  it("should pass the contact details to the Lumen avatar in the detail", () => {
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
    expect(avatar.props).toMatchObject({
      size: "xl",
      alt: "Benoit",
      lx: { backgroundColor: resolveAvatarColor(contactId) },
    });
  });
});
