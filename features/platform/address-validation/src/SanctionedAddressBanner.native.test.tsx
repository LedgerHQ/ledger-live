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
      React.createElement("Button", { onPress }, React.createElement("Text", undefined, children)),
  };
});

describe("SanctionedAddressBanner", () => {
  it("should render the injected content and invoke its action", () => {
    const onAction = jest.fn();

    render(
      <SanctionedAddressBanner
        description="This address is blocked."
        actionLabel="Learn more"
        onAction={onAction}
        testID="sanctioned-address-banner"
      />,
    );

    expect(screen.getByTestId("sanctioned-address-banner")).toBeTruthy();
    expect(screen.getByText("This address is blocked.")).toBeTruthy();

    fireEvent.press(screen.getByText("Learn more"));

    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
