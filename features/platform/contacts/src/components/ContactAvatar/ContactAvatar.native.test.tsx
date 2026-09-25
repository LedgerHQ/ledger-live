import React from "react";
import { render as renderWithoutI18n, screen } from "@testing-library/react-native";
import { ContactsI18nTestProvider } from "../../testing/ContactsI18nTestProvider";
import { ContactIdSchema, DEFAULT_ME_CONTACT_ID } from "@domain/entity-contact";
import { ContactAvatar } from ".";
import { ME_AVATAR_URL } from "../MeAvatar/meAvatarUrl";

const render = (ui: React.ReactElement) =>
  renderWithoutI18n(ui, { wrapper: ContactsI18nTestProvider });

jest.mock("@ledgerhq/lumen-ui-rnative", () => ({
  Avatar: ({ testID, ...props }: { testID?: string }) => {
    const { View } = jest.requireActual<typeof import("react-native")>("react-native");
    return <View testID={testID} {...props} />;
  },
  useResolveAvatarColor: (contactId: string) => `avatar-color-${contactId}`,
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

  it("should render the Me avatar for the Me contact", () => {
    const contactId = ContactIdSchema.parse(DEFAULT_ME_CONTACT_ID);

    render(
      <ContactAvatar
        contactId={contactId}
        name="My Wallet"
        size="xl"
        testId="contacts-detail-me-avatar"
      />,
    );

    const avatar = screen.getByTestId("contacts-detail-me-avatar");

    expect(avatar).toBeVisible();
    expect(avatar).toHaveProp("size", "xl");
    expect(avatar).toHaveProp("appearance", "thin");
    expect(avatar).toHaveProp("src", ME_AVATAR_URL);
    expect(avatar).toHaveProp("alt", "My Wallet (Me)");
    expect(avatar.props).not.toHaveProperty("fallbackText");
  });
});
