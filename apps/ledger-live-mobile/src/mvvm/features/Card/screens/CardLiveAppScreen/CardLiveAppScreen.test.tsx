import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { CardLiveAppScreen } from "./index";
import { CARD_LANDING_TEST_IDS } from "../../testIds";
import { CARD_APP_ID } from "../../constants";

jest.mock("~/screens/PTX", () => {
  const React = require("react");
  const { View: RNView } = require("react-native");
  return {
    PtxScreen: () => React.createElement(RNView, { testID: "card-live-app-mock" }),
  };
});

const Stack = createNativeStackNavigator();

function TestNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={ScreenName.Card}
        component={CardLiveAppScreen}
        initialParams={{ platform: CARD_APP_ID }}
      />
    </Stack.Navigator>
  );
}

describe("CardLiveAppScreen", () => {
  it("renders the Card Live App screen with mocked PtxScreen", () => {
    render(<TestNavigator />);

    expect(screen.getByTestId(CARD_LANDING_TEST_IDS.cardLiveAppMock)).toBeOnTheScreen();
  });

  it("renders without error when given platform param", () => {
    render(<TestNavigator />);

    expect(screen.getByTestId(CARD_LANDING_TEST_IDS.cardLiveAppMock)).toBeVisible();
  });
});
