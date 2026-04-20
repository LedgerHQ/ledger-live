import React from "react";
import { Pressable, Text, View } from "react-native";

jest.mock("@ledgerhq/lumen-design-core", () => ({
  ledgerLiveThemes: {},
}));

jest.mock("@ledgerhq/lumen-ui-rnative", () => ({
  ThemeProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  Box: ({ children, testID }: { children?: React.ReactNode; testID?: string }) => (
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
