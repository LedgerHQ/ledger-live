import React from "react";
import { render, screen } from "@testing-library/react";
import { ContactIdSchema } from "@domain/entity-contact";
import { getContactAvatarColorClass } from "../../utils/getContactAvatarColorClass";
import { ContactAvatar } from "./ContactAvatar.web";

describe("ContactAvatar", () => {
  it("should bind a contact initial and stable color for the default list size", () => {
    const contactId = ContactIdSchema.parse("contact-elodie");

    render(<ContactAvatar contactId={contactId} name="élodie" />);

    const avatar = screen.getByRole("img", { name: "élodie" });

    expect(avatar).toBeVisible();
    expect(avatar).toHaveTextContent("É");
    expect(avatar).toHaveClass("size-32");
    expect(avatar).toHaveClass(...getContactAvatarColorClass(contactId).split(" "));
  });

  it("should support the detail size and a custom test identifier", () => {
    const contactId = ContactIdSchema.parse("contact-benoit");

    render(
      <ContactAvatar
        contactId={contactId}
        name="Benoit"
        size="xl"
        testId="contacts-detail-avatar"
      />,
    );

    const avatar = screen.getByTestId("contacts-detail-avatar");

    expect(avatar).toBeVisible();
    expect(avatar).toHaveTextContent("B");
    expect(avatar).toHaveClass("size-80");
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
