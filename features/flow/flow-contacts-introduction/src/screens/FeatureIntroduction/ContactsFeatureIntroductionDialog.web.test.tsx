import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactsFeatureIntroductionDialog } from "./ContactsFeatureIntroductionDialog";

function renderDialog() {
  const onComplete = jest.fn();
  const onDefer = jest.fn();

  render(
    <ContactsFeatureIntroductionDialog
      isOpen
      title="Add contacts"
      description="Save verified recipient addresses."
      highlights={[
        { icon: "Contact", title: "Save recipients", description: "Reuse an address safely." },
      ]}
      primaryActionLabel="Get started"
      secondaryActionLabel="Not now"
      heroImageSrc="https://example.com/contacts.webp"
      onComplete={onComplete}
      onDefer={onDefer}
    />,
  );

  return { onComplete, onDefer };
}

describe("ContactsFeatureIntroductionDialog", () => {
  it("should render the feature content and complete the introduction", async () => {
    const { onComplete, onDefer } = renderDialog();
    const user = userEvent.setup();

    expect(screen.getByTestId("contacts-feature-introduction-dialog")).toBeVisible();
    expect(screen.getByTestId("contacts-feature-introduction-hero")).toBeVisible();
    expect(screen.getByText("Save recipients")).toBeVisible();

    await user.click(screen.getByTestId("contacts-feature-introduction-primary"));
    await user.click(screen.getByTestId("contacts-feature-introduction-primary"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onDefer).not.toHaveBeenCalled();
  });

  it("should defer the introduction from the secondary action", async () => {
    const { onComplete, onDefer } = renderDialog();
    const user = userEvent.setup();

    await user.click(screen.getByTestId("contacts-feature-introduction-secondary"));

    expect(onDefer).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
