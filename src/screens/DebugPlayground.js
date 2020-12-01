// @flow

import React from "react";
import { StyleSheet, View } from "react-native";
import NavigationScrollView from "../components/NavigationScrollView";
import colors from "../colors";
import LText from "../components/LText";
import Button from "../components/Button";

export default function DebugPlayground() {
  return (
    <NavigationScrollView>
      <View style={styles.root}>
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
    backgroundColor: colors.white,
  },
});
