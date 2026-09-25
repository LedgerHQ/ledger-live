import React from "react";
import { render as renderWithoutI18n, screen } from "@testing-library/react";
import { ContactsI18nTestProvider } from "../../testing/ContactsI18nTestProvider";
import { ContactIdSchema, DEFAULT_ME_CONTACT_ID } from "@domain/entity-contact";
import { ContactAvatar } from ".";

const render = (ui: React.ReactElement) =>
  renderWithoutI18n(ui, { wrapper: ContactsI18nTestProvider });

describe("ContactAvatar", () => {
  it("should bind a contact initial and Lumen pastel color for the default list size", () => {
    const contactId = ContactIdSchema.parse("contact-elodie");

    render(<ContactAvatar isMe={false} contactId={contactId} name="élodie Martin" />);

    const avatar = screen.getByRole("img", { name: "élodie Martin" });

    expect(avatar).toBeVisible();
    expect(avatar).toHaveTextContent("ÉM");
    expect(avatar).toHaveAttribute("data-size", "sm");
    expect(avatar).toHaveAttribute("data-fallback-color", "avatar-color:contact-elodie");
  });

  it("should support the detail size and a custom test identifier", () => {
    const contactId = ContactIdSchema.parse("contact-benoit");

    render(
      <ContactAvatar
        isMe={false}
        contactId={contactId}
        name="Benoit Jean"
        size="xl"
        testId="contacts-detail-avatar"
      />,
    );

    const avatar = screen.getByTestId("contacts-detail-avatar");

    expect(avatar).toBeVisible();
    expect(avatar).toHaveTextContent("BJ");
    expect(avatar).toHaveAttribute("data-size", "xl");
  });

  it.each([["xs"], ["sm"], ["md"], ["lg"], ["xl"], ["2xl"]] as const)(
    "should support the %s Lumen avatar size",
    size => {
      const contactId = ContactIdSchema.parse(`contact-${size}`);

      render(<ContactAvatar isMe={false} contactId={contactId} name="Benoit" size={size} />);

      expect(screen.getByTestId(`contacts-avatar-${contactId}`)).toHaveAttribute("data-size", size);
    },
  );

  it("should render the Me profile image instead of a generated initial", () => {
    const contactId = ContactIdSchema.parse(DEFAULT_ME_CONTACT_ID);

    render(
      <ContactAvatar
        isMe
        contactId={contactId}
        name="My Wallet"
        size="xl"
        testId="contacts-detail-me-avatar"
      />,
    );

    const avatar = screen.getByTestId("contacts-detail-me-avatar");

    expect(avatar).toBeVisible();
    expect(avatar).not.toHaveTextContent("M");
  });

  it("should support a decorative avatar without an accessible label", () => {
    const contactId = ContactIdSchema.parse("contact-detail");

    render(
      <ContactAvatar
        isMe={false}
        contactId={contactId}
        name="Benoit"
        ariaHidden
        testId="contacts-detail-avatar"
      />,
    );

    const avatar = screen.getByTestId("contacts-detail-avatar");

    expect(avatar).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img", { name: "Benoit" })).not.toBeInTheDocument();
  });

  it("should not expose an empty accessible label", () => {
    const contactId = ContactIdSchema.parse("contact-empty");

    render(
      <ContactAvatar isMe={false} contactId={contactId} name="" testId="contacts-empty-avatar" />,
    );

    const avatar = screen.getByTestId("contacts-empty-avatar");

    expect(avatar).not.toHaveAttribute("role");
    expect(avatar).not.toHaveAttribute("aria-label");
  });
});
