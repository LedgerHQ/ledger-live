import React from "react";
import { render } from "@tests/test-renderer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { screen } from "~/analytics/segment";
import OperationsList from "../index";
import { ScreenName } from "~/const/navigation";
import { OperationsListNavigator } from "../types";

const Stack = createNativeStackNavigator<OperationsListNavigator>();

const MockNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name={ScreenName.OperationsList} component={OperationsList} />
  </Stack.Navigator>
);

describe("OperationsList", () => {
  it("tracks the OperationsList screen on focus", () => {
    render(<MockNavigator />);

    expect(screen).toHaveBeenCalledWith(undefined, "OperationsList", {}, true, true, false, false);
  });
});
