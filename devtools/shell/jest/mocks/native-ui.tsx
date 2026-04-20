import React from "react";
import { Pressable, Text, View } from "react-native";

jest.mock("@ledgerhq/native-ui", () => ({
  StyleProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  Flex: ({ children, testID }: { children?: React.ReactNode; testID?: string }) => (
    <View testID={testID}>{children}</View>
  ),
  Text: ({ children, testID }: { children?: React.ReactNode; testID?: string }) => (
    <Text testID={testID}>{children}</Text>
  ),
  Button: ({
    children,
    onPress,
    accessibilityLabel,
  }: {
    children?: React.ReactNode;
    onPress?: () => void;
    accessibilityLabel?: string;
  }) => (
    <Pressable onPress={onPress} accessibilityLabel={accessibilityLabel} accessibilityRole="button">
      <Text>{children}</Text>
    </Pressable>
  ),
}));
