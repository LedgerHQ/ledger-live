import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { SanctionedAddressBanner } from "./SanctionedAddressBanner.native";

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const React = require("react");

  return {
    Banner: ({
      description,
      primaryAction,
      testID,
    }: {
      description: string;
      primaryAction?: React.ReactNode;
      testID?: string;
    }) =>
      React.createElement(
        "Banner",
        { testID },
        React.createElement("Text", undefined, description),
        primaryAction,
      ),
    Button: ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) =>
      React.createElement(
        "Button",
        { onPress, testID: "sanctioned-address-banner-action" },
        React.createElement("Text", undefined, children),
      ),
  };
});

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

    fireEvent.press(screen.getByTestId("sanctioned-address-banner-action"));

    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
