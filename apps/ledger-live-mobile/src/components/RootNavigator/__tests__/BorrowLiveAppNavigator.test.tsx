import React from "react";
import { Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import BorrowLiveAppNavigator from "../BorrowLiveAppNavigator";

jest.mock("LLM/features/Borrow", () => ({
  BorrowLiveAppWrapper: () => <Text testID="borrow-live-app-wrapper">Borrow Live App</Text>,
}));

jest.mock("~/navigation/navigatorConfig", () => ({
  getStackNavigatorConfig: jest.fn(() => ({ headerShown: true })),
}));

describe("BorrowLiveAppNavigator", () => {
  it("renders the borrow live app wrapper screen", () => {
    render(<BorrowLiveAppNavigator />);

    expect(screen.getByTestId("borrow-live-app-wrapper")).toBeOnTheScreen();
    expect(jest.mocked(getStackNavigatorConfig)).toHaveBeenCalled();
  });
});
