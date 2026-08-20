import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ContactIdSchema } from "@domain/entity-contact";
import { ContactAvatar } from ".";

jest.mock("@ledgerhq/lumen-ui-rnative", () => ({
  Avatar: ({ testID, ...props }: { testID?: string }) => {
    const { View } = jest.requireActual<typeof import("react-native")>("react-native");
    return <View testID={testID} {...props} />;
  },
  resolveAvatarColor: (contactId: string) => `avatar-color-${contactId}`,
}));

describe("ContactAvatar", () => {
  it("should pass the contact details to the Lumen avatar in the list", () => {
    const contactId = ContactIdSchema.parse("contact-elodie");

    render(<ContactAvatar contactId={contactId} name="élodie" />);

    const avatar = screen.getByTestId(`contacts-avatar-${contactId}`);

    expect(avatar).toBeVisible();
    expect(avatar).toHaveProp("size", "sm");
    expect(avatar).toHaveProp("alt", "élodie");
    expect(avatar).toHaveProp("fallbackText", "É");
    expect(avatar).toHaveProp("fallbackColor", `avatar-color-${contactId}`);
  });

  it("should pass the contact details to the Lumen avatar in the detail", () => {
    const contactId = ContactIdSchema.parse("contact-benoit");

    render(
      <ContactAvatar
        contactId={contactId}
        name="Benoit Jean"
        size="xl"
        testId="contacts-detail-avatar"
      />,
    );

    const avatar = screen.getByTestId("contacts-detail-avatar");

    expect(avatar).toBeVisible();
    expect(avatar).toHaveProp("size", "xl");
    expect(avatar).toHaveProp("alt", "Benoit Jean");
    expect(avatar).toHaveProp("fallbackText", "BJ");
    expect(avatar).toHaveProp("fallbackColor", `avatar-color-${contactId}`);
  });

  it.each(["xs", "md", "lg", "2xl"] as const)("should support the %s Lumen avatar size", size => {
    const contactId = ContactIdSchema.parse(`contact-${size}`);

    render(<ContactAvatar contactId={contactId} name="Benoit" size={size} />);

    expect(screen.getByTestId(`contacts-avatar-${contactId}`)).toHaveProp("size", size);
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
        testId="contacts-detail-me-avatar"
      />,
    );

    const avatar = screen.getByTestId("contacts-detail-me-avatar");

    expect(avatar).toBeVisible();
    expect(avatar).toHaveProp("size", "xl");
    expect(avatar).toHaveProp("src", "https://example.com/me.png");
    expect(avatar).toHaveProp("alt", "My Wallet");
    expect(avatar).toHaveProp("fallbackText", "MW");
    expect(avatar.props).not.toHaveProperty("fallbackColor");
  });
});
