// @flow

import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import NavigationScrollView from "../components/NavigationScrollView";
import LText from "../components/LText";
import Button from "../components/Button";

export default function DebugPlayground() {
  const { colors } = useTheme();
  return (
    <NavigationScrollView>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <LText tertiary>
          {
            "Convenience screen for testing purposes, please leave empty when commiting."
          }
        </LText>
        <Button
          mt={2}
          type={"primary"}
          event={""}
          onPress={undefined}
          title={"Action"}
        />
      </View>
    </NavigationScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
  },
});
