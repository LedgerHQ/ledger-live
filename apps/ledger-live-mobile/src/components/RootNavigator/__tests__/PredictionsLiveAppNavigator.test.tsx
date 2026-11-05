import React from "react";
import { Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import PredictionsLiveAppNavigator from "../PredictionsLiveAppNavigator";

jest.mock("LLM/features/Predictions", () => ({
  PredictionsLiveApp: () => <Text testID="predictions-live-app">Predictions</Text>,
}));

describe("PredictionsLiveAppNavigator", () => {
  it("should render the Predictions live app screen", () => {
    render(<PredictionsLiveAppNavigator />);

    expect(screen.getByTestId("predictions-live-app")).toBeOnTheScreen();
  });
});
