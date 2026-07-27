import React from "react";
import { render, screen } from "@tests/test-renderer";
import { CONTACTS_FEATURE_INTRODUCTION_HIGHLIGHTS } from "@features/flow-contacts";
import { ContactsFeatureIntroductionSheet } from ".";

const highlights = CONTACTS_FEATURE_INTRODUCTION_HIGHLIGHTS.map(({ icon, translationKey }) => ({
  icon,
  title: `${translationKey}-title`,
  description: `${translationKey}-description`,
}));

describe("ContactsFeatureIntroductionSheet", () => {
  it("should call onComplete once from Try contacts", async () => {
    const onComplete = jest.fn();
    const onDefer = jest.fn();
    const { user } = render(
      <ContactsFeatureIntroductionSheet
        isOpen
        title="Introducing Contacts"
        description="Your address book for crypto."
        highlights={highlights}
        primaryActionLabel="Try contacts"
        secondaryActionLabel="Maybe later"
        onComplete={onComplete}
        onDefer={onDefer}
      />,
    );

    expect(screen.getByTestId("contacts-feature-introduction-primary")).toBeVisible();

    await user.press(screen.getByTestId("contacts-feature-introduction-primary"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onDefer).not.toHaveBeenCalled();
  });

  it("should call onDefer once from Maybe later", async () => {
    const onComplete = jest.fn();
    const onDefer = jest.fn();
    const { user } = render(
      <ContactsFeatureIntroductionSheet
        isOpen
        title="Introducing Contacts"
        description="Your address book for crypto."
        highlights={highlights}
        primaryActionLabel="Try contacts"
        secondaryActionLabel="Maybe later"
        onComplete={onComplete}
        onDefer={onDefer}
      />,
    );

    await user.press(screen.getByTestId("contacts-feature-introduction-secondary"));

    expect(onDefer).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
