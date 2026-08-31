import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { CONTACTS_FEATURE_INTRODUCTION_HERO_IMAGE } from "./assets";
import { ContactsFeatureIntroductionContent } from "./ContactsFeatureIntroductionContent";

function renderContent(isOpen = true) {
  const onComplete = jest.fn();

  render(
    <ContactsFeatureIntroductionContent
      isOpen={isOpen}
      title="Add contacts"
      highlights={[
        { icon: "Contact", title: "Save recipients", description: "Reuse an address safely." },
        { icon: "ShieldCheck", title: "Send safely", description: "Trust the recipient." },
        { icon: "Devices", title: "Keep in sync", description: "Use Ledger Sync." },
      ]}
      primaryActionLabel="Get started"
      bottomInset={12}
      onComplete={onComplete}
    />,
  );

  return { onComplete };
}

describe("ContactsFeatureIntroductionContent", () => {
  it("should render the native introduction with its bundled hero and complete it", () => {
    const { onComplete } = renderContent();

    expect(screen.getByTestId("contacts-feature-introduction-hero")).toBeVisible();
    expect(screen.getByTestId("contacts-feature-introduction-hero-image")).toHaveProp(
      "source",
      CONTACTS_FEATURE_INTRODUCTION_HERO_IMAGE,
    );
    expect(screen.getByText("Save recipients")).toBeVisible();
    expect(screen.getByTestId("contacts-feature-introduction-highlight-Contact")).toBeVisible();
    expect(screen.getByTestId("contacts-feature-introduction-highlight-ShieldCheck")).toBeVisible();
    expect(screen.getByTestId("contacts-feature-introduction-highlight-Devices")).toBeVisible();
    expect(screen.queryByTestId("contacts-feature-introduction-secondary")).toBeNull();

    fireEvent.press(screen.getByTestId("contacts-feature-introduction-primary"));

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("should hide the introduction content when it is closed", () => {
    renderContent(false);

    expect(screen.queryByText("Add contacts")).toBeNull();
  });
});
