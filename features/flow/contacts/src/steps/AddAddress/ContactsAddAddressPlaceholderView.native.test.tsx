import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ContactsAddAddressPlaceholderView } from "./ContactsAddAddressPlaceholderView.native";

describe("ContactsAddAddressPlaceholderView", () => {
  it("should render its content and continue the flow", () => {
    const onContinue = jest.fn();

    render(
      <ContactsAddAddressPlaceholderView
        title="Name"
        buttonLabel="Continue"
        testID="name-screen"
        onContinue={onContinue}
      />,
    );

    expect(screen.getByTestId("name-screen")).toHaveStyle({
      bottom: 0,
      paddingBottom: 32,
    });
    expect(screen.getByText("Name")).toBeVisible();

    fireEvent.press(screen.getByTestId("name-screen-continue"));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
