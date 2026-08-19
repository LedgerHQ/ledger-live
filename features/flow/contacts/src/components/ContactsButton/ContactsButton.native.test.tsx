import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ContactsButton } from "./ContactsButton.native";

describe("ContactsButton", () => {
  it("should render the Contacts card and invoke its action", () => {
    const onPress = jest.fn();

    render(
      <ContactsButton
        title="Contacts"
        description="Save and manage external wallet addresses."
        onPress={onPress}
      />,
    );

    expect(screen.getByTestId("my-wallet-contacts-button")).toBeVisible();
    expect(screen.getByText("Contacts")).toBeVisible();
    expect(screen.getByText("Save and manage external wallet addresses.")).toBeVisible();

    fireEvent.press(screen.getByTestId("my-wallet-contacts-button"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should display the New badge when it is provided", () => {
    render(
      <ContactsButton
        title="Contacts"
        description="Save and manage external wallet addresses."
        newBadgeLabel="New"
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByTestId("contacts-button-new-badge")).toBeVisible();
  });
});
