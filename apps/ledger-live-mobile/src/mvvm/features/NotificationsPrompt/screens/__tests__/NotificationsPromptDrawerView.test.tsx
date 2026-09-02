import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { NotificationsPromptDrawerView } from "../NotificationsPromptDrawerView";

jest.mock("~/images/illustration/Illustration", () => "Illustration");
jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("LLM/features/NotificationsPrompt/components/NotificationsDrawerIllustration", () => ({
  NotificationsDrawerIllustration: () => null,
}));
jest.mock("LLM/features/NotificationsPrompt/components/NotificationsPromptContent", () => ({
  NotificationsPromptContent: () => null,
}));
jest.mock("@ledgerhq/native-ui", () => {
  const { View, Text, Pressable } = require("react-native");
  return {
    Flex: ({ children }: { children?: React.ReactNode }) => <View>{children}</View>,
    Button: ({
      children,
      onPress,
      testID,
    }: {
      children?: React.ReactNode;
      onPress?: () => void;
      testID?: string;
    }) => (
      <Pressable testID={testID} onPress={onPress}>
        <Text>{children}</Text>
      </Pressable>
    ),
    Link: ({
      children,
      onPress,
      testID,
    }: {
      children?: React.ReactNode;
      onPress?: () => void;
      testID?: string;
    }) => (
      <Pressable testID={testID} onPress={onPress}>
        <Text>{children}</Text>
      </Pressable>
    ),
  };
});

describe("NotificationsPromptDrawerView", () => {
  it("should call onAllow and onLater from the prompt actions", () => {
    const onAllow = jest.fn();
    const onLater = jest.fn();

    render(
      <NotificationsPromptDrawerView
        promptTarget="globalPushNotifications"
        onAllow={onAllow}
        onLater={onLater}
      />,
    );

    fireEvent.press(screen.getByTestId("notifications-prompt-allow"));
    fireEvent.press(screen.getByTestId("notifications-prompt-later"));

    expect(onAllow).toHaveBeenCalledTimes(1);
    expect(onLater).toHaveBeenCalledTimes(1);
  });
});
