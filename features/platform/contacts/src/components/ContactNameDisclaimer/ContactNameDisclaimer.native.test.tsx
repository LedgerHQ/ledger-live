import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ContactNameDisclaimer } from ".";

describe("ContactNameDisclaimer", () => {
  it("should render the disclaimer text", () => {
    render(
      <ContactNameDisclaimer
        text="Contact names are stored on this device only."
        testID="contacts-name-disclaimer"
      />,
    );

    expect(screen.getByTestId("contacts-name-disclaimer")).toBeVisible();
    expect(screen.getByText("Contact names are stored on this device only.")).toBeVisible();
  });
});
