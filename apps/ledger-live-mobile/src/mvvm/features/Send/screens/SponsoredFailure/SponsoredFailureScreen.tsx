import React from "react";
import { StyleSheet } from "react-native";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import { useSponsoredFailureViewModel } from "./hooks/useSponsoredFailureViewModel";

export function SponsoredFailureScreen() {
  const { message, retryLabel, cancelLabel, onRetry, onCancel } = useSponsoredFailureViewModel();

  return (
    <Flex
      style={StyleSheet.absoluteFill}
      bg="background.main"
      flex={1}
      alignItems="center"
      justifyContent="center"
      px={6}
      rowGap={24}
    >
      {message ? (
        <Text variant="body" color="neutral.c80" textAlign="center">
          {message}
        </Text>
      ) : null}
      <Flex width="100%" rowGap={12}>
        <Button type="main" onPress={onRetry} testID="sponsored-failure-retry">
          {retryLabel}
        </Button>
        <Button type="default" onPress={onCancel} testID="sponsored-failure-cancel">
          {cancelLabel}
        </Button>
      </Flex>
    </Flex>
  );
}
