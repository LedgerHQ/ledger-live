import React from "react";
import { View, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import CardNavigator from "../Navigator";
import { CARD_LANDING_TEST_IDS } from "../testIds";

const Stack = createNativeStackNavigator();

function MockCardLiveApp() {
  return (
    <View testID={CARD_LANDING_TEST_IDS.cardLiveAppMock}>
      <Text>Card Live App</Text>
    </View>
  );
}

function CardFeatureTestNavigator() {
  return (
    <Stack.Navigator initialRouteName={NavigatorName.CardTab}>
      <Stack.Screen
        name={NavigatorName.CardTab}
        component={CardNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ScreenName.PlatformApp}
        component={MockCardLiveApp}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

describe("Card feature integration", () => {
  it("navigates from Landing to Card Live App when Explore cards is pressed", async () => {
    const { user } = render(<CardFeatureTestNavigator />);

    expect(screen.getByTestId(CARD_LANDING_TEST_IDS.screen)).toBeOnTheScreen();

    await user.press(screen.getByTestId(CARD_LANDING_TEST_IDS.ctas.exploreCards));

    expect(screen.getByTestId(CARD_LANDING_TEST_IDS.cardLiveAppMock)).toBeOnTheScreen();
  });

  it("navigates from Landing to Card Live App when I have a card is pressed", async () => {
    const { user } = render(<CardFeatureTestNavigator />);

    expect(screen.getByTestId(CARD_LANDING_TEST_IDS.screen)).toBeOnTheScreen();

    await user.press(screen.getByTestId(CARD_LANDING_TEST_IDS.ctas.iHaveACard));

    expect(screen.getByTestId(CARD_LANDING_TEST_IDS.cardLiveAppMock)).toBeOnTheScreen();
  });
});
