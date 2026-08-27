import React from "react";
import { Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { WaitForAppReady } from "../WaitForAppReady";

describe("WaitForAppReady", () => {
  it("should render children without waiting for OFAC, flags, or currency", () => {
    render(
      <WaitForAppReady currencyInitialized={false}>
        <Text>App is Ready</Text>
      </WaitForAppReady>,
    );
    expect(screen.getByText("App is Ready")).toBeOnTheScreen();
  });
});
