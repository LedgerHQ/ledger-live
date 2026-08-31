import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CONTACTS_FEATURE_INTRODUCTION_HERO_IMAGE } from "./assets";
import { ContactsFeatureIntroductionDialog } from "./ContactsFeatureIntroductionDialog";

function renderDialog() {
  const onComplete = jest.fn();
  const onClose = jest.fn();

  render(
    <ContactsFeatureIntroductionDialog
      isOpen
      title="Add contacts"
      highlights={[
        { icon: "Contact", title: "Save recipients", description: "Reuse an address safely." },
      ]}
      primaryActionLabel="Get started"
      onComplete={onComplete}
      onClose={onClose}
    />,
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
    expect(screen.getByText("Save recipients")).toBeVisible();
    expect(screen.queryByTestId("contacts-feature-introduction-secondary")).toBeNull();

    await user.click(screen.getByTestId("contacts-feature-introduction-primary"));
    await user.click(screen.getByTestId("contacts-feature-introduction-primary"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });
});
