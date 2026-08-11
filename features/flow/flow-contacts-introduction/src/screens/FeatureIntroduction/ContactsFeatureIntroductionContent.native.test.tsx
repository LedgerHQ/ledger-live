import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ContactsFeatureIntroductionContent } from "./ContactsFeatureIntroductionContent.native";

function renderContent(isOpen = true) {
  const onComplete = jest.fn();
  const onDefer = jest.fn();

  render(
    <ContactsFeatureIntroductionContent
      isOpen={isOpen}
      title="Add contacts"
      description="Save verified recipient addresses."
      highlights={[
        { icon: "Contact", title: "Save recipients", description: "Reuse an address safely." },
      ]}
      primaryActionLabel="Get started"
      secondaryActionLabel="Not now"
      heroImageSrc="https://example.com/contacts.webp"
      bottomInset={12}
      onComplete={onComplete}
      onDefer={onDefer}
    />,
  );

  return { onComplete, onDefer };
}

describe("ContactsFeatureIntroductionContent", () => {
  it("should render the native introduction and dispatch its actions", () => {
    const { onComplete, onDefer } = renderContent();

    expect(screen.getByTestId("contacts-feature-introduction-hero")).toBeVisible();
    expect(screen.getByText("Save recipients")).toBeVisible();

    fireEvent.press(screen.getByTestId("contacts-feature-introduction-primary"));
    fireEvent.press(screen.getByTestId("contacts-feature-introduction-secondary"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onDefer).toHaveBeenCalledTimes(1);
  });

  it("should hide the introduction content when it is closed", () => {
    renderContent(false);

    expect(screen.queryByText("Add contacts")).toBeNull();
  });
});
