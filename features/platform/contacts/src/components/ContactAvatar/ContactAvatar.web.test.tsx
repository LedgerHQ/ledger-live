import React from "react";
import { render, screen } from "@testing-library/react";
import { ContactIdSchema } from "@domain/entity-contact";
import { getContactAvatarColorClass } from "../../utils/getContactAvatarColorClass";
import { ContactAvatar } from "./ContactAvatar";

describe("ContactAvatar", () => {
  it("should bind a contact initial and stable color for the default list size", () => {
    const contactId = ContactIdSchema.parse("contact-elodie");

    render(<ContactAvatar contactId={contactId} name="élodie Martin" />);

    const avatar = screen.getByRole("img", { name: "élodie Martin" });

    expect(avatar).toBeVisible();
    expect(avatar).toHaveTextContent("ÉM");
    expect(avatar).toHaveClass("size-40");
    expect(avatar).toHaveClass(...getContactAvatarColorClass(contactId).split(" "));
  });

  it("should support the detail size and a custom test identifier", () => {
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
    expect(avatar).toHaveTextContent("BJ");
    expect(avatar).toHaveClass("size-72");
  });

  it.each([
    ["xs", "size-24"],
    ["sm", "size-40"],
    ["md", "size-48"],
    ["lg", "size-56"],
    ["xl", "size-72"],
    ["2xl", "size-128"],
  ] as const)("should support the %s Lumen avatar size", (size, expectedClass) => {
    const contactId = ContactIdSchema.parse(`contact-${size}`);

    render(<ContactAvatar contactId={contactId} name="Benoit" size={size} />);

    expect(screen.getByTestId(`contacts-avatar-${contactId}`)).toHaveClass(expectedClass);
  });

  it("should render the Me profile image instead of a generated initial", () => {
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
    expect(avatar).not.toHaveTextContent("M");
  });

  it("should support a decorative avatar without an accessible label", () => {
    const contactId = ContactIdSchema.parse("contact-detail");

    render(
      <ContactAvatar
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

    render(<ContactAvatar contactId={contactId} name="" testId="contacts-empty-avatar" />);

    const avatar = screen.getByTestId("contacts-empty-avatar");

    expect(avatar).not.toHaveAttribute("role");
    expect(avatar).not.toHaveAttribute("aria-label");
  });
});
