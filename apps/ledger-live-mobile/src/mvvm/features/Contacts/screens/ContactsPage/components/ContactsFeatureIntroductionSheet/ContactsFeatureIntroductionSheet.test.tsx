import React from "react";
import { render, screen } from "@tests/test-renderer";
import { ContactsFeatureIntroductionSheet } from ".";

describe("ContactsFeatureIntroductionSheet", () => {
  it("should call onComplete once from Explore now", async () => {
    const onComplete = jest.fn();
    const onClose = jest.fn();
    const { user } = render(
      <ContactsFeatureIntroductionSheet isOpen onComplete={onComplete} onClose={onClose} />,
    );

    expect(screen.getByTestId("contacts-feature-introduction-primary")).toBeVisible();

    await user.press(screen.getByTestId("contacts-feature-introduction-primary"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByTestId("contacts-feature-introduction-secondary")).toBeNull();
  });

  it("should call onClose once from the sheet header", async () => {
    const onComplete = jest.fn();
    const onClose = jest.fn();
    const { user } = render(
      <ContactsFeatureIntroductionSheet isOpen onComplete={onComplete} onClose={onClose} />,
    );

    await user.press(screen.getByTestId("bottom-sheet-header-close-button"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
