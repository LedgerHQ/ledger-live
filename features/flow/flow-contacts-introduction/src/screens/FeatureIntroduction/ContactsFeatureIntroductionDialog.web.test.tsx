import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nTestProvider } from "@shared/i18n/testing";
import { CONTACTS_FEATURE_INTRODUCTION_HERO_IMAGE } from "./assets";
import { ContactsFeatureIntroductionDialog } from "./ContactsFeatureIntroductionDialog";

function renderDialog() {
  const onComplete = jest.fn();
  const onClose = jest.fn();

  render(
    <I18nTestProvider>
      <ContactsFeatureIntroductionDialog isOpen onComplete={onComplete} onClose={onClose} />
    </I18nTestProvider>,
  );

  return { onComplete, onClose };
}

describe("ContactsFeatureIntroductionDialog", () => {
  it("should render the feature content and complete the introduction", async () => {
    const { onComplete, onClose } = renderDialog();
    const user = userEvent.setup();

    expect(screen.getByTestId("contacts-feature-introduction-dialog")).toBeVisible();
    expect(screen.getByTestId("contacts-feature-introduction-hero")).toBeVisible();
    expect(
      screen.getByTestId("contacts-feature-introduction-hero").querySelector("img"),
    ).toHaveAttribute("src", CONTACTS_FEATURE_INTRODUCTION_HERO_IMAGE);
    expect(
      screen.getByText("contacts.featureIntroduction.highlights.saveAddresses.title"),
    ).toBeVisible();
    expect(screen.queryByTestId("contacts-feature-introduction-secondary")).toBeNull();

    await user.click(screen.getByTestId("contacts-feature-introduction-primary"));
    await user.click(screen.getByTestId("contacts-feature-introduction-primary"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });
});
