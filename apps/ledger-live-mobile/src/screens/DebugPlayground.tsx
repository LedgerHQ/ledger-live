import React from "react";
import { StyleSheet } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import NavigationScrollView from "../components/NavigationScrollView";
import Button from "../components/Button";

export default function DebugPlayground() {
  return (
    <NavigationScrollView>
      <Flex style={styles.root}>
        <Text>
          {
            "Convenience screen for testing purposes, please leave empty when committing."
          }
        </Text>
        <Button
          mt={2}
          type={"primary"}
          event={""}
          onPress={undefined}
          title={"Action"}
        />
      </Flex>
    </NavigationScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
  },
});
