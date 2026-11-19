import React from "react";
import { Button } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { render, screen, fireEvent } from "@tests/test-renderer";
import { ReceiveNavigator } from "../Navigator";

const mockNotifyFlowCompleted = jest.fn();

jest.mock("LLM/features/NotificationsPrompt", () => ({
  useNotificationsPrompt: () => ({ notifyFlowCompleted: mockNotifyFlowCompleted }),
}));

function MockReceiveAddressScreen() {
  const navigation = useNavigation();
  return <Button title="Leave receive" onPress={() => navigation.getParent()?.goBack()} />;
}

jest.mock("../screens/ReceiveAddress", () => MockReceiveAddressScreen);

const Stack = createNativeStackNavigator();

function Home() {
  return null;
}

describe("ReceiveNavigator", () => {
  it("should report the receive flow completed when the user leaves it", () => {
    render(
      <Stack.Navigator>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Receive" component={ReceiveNavigator} />
      </Stack.Navigator>,
      {
        navigationInitialState: {
          index: 1,
          routes: [{ name: "Home" }, { name: "Receive" }],
        },
      },
    );

    expect(mockNotifyFlowCompleted).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText("Leave receive"));

    expect(mockNotifyFlowCompleted).toHaveBeenCalledWith("receive");
  });
});
