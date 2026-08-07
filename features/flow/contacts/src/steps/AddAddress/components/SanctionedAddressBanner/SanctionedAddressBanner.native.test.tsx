import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { SanctionedAddressBanner } from "./SanctionedAddressBanner.native";

describe("SanctionedAddressBanner", () => {
  it("should render the supplied feedback and invoke its action", () => {
    const onAction = jest.fn();

    render(
      <SanctionedAddressBanner
        description="This wallet address is sanctioned."
        actionLabel="Learn more"
        onAction={onAction}
      />,
    );

    expect(screen.getByTestId("contacts-sanctioned-address-banner")).toBeVisible();
    expect(screen.getByText("This wallet address is sanctioned.")).toBeVisible();

    fireEvent.press(screen.getByText("Learn more"));

    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
