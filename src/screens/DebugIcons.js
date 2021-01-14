// @flow

import React from "react";
import { StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { UserRefusedAddress } from "@ledgerhq/errors";
import { useTheme } from "@react-navigation/native";
import DeviceNanoAction from "../components/DeviceNanoAction";
import NavigationScrollView from "../components/NavigationScrollView";

const forceInset = { bottom: "always" };

export default function DebugIcons() {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={forceInset}
    >
      <NavigationScrollView contentContainerStyle={styles.scrollView}>
        <DeviceNanoAction width={250} />
        <DeviceNanoAction width={250} action="accept" screen="validation" />
        <DeviceNanoAction width={250} screen="home" />
        <DeviceNanoAction width={250} action="left" screen="empty" wired />
        <DeviceNanoAction width={250} action="accept" screen="pin" />
        <DeviceNanoAction width={250} error={new UserRefusedAddress()} />
        <DeviceNanoAction width={250} error={new Error("wahtevr")} />
        <DeviceNanoAction width={250} wired />

        <DeviceNanoAction width={250} modelId="nanoS" />
        <DeviceNanoAction
          width={250}
          modelId="nanoS"
          error={new Error("wahtevr")}
        />
        <DeviceNanoAction
          width={250}
          modelId="nanoS"
          error={new UserRefusedAddress()}
        />
        <DeviceNanoAction
          width={250}
          modelId="nanoS"
          wired
          action="accept"
          screen="validation"
        />
        <DeviceNanoAction width={250} modelId="nanoS" wired action="left" />
        <DeviceNanoAction
          width={250}
          modelId="nanoS"
          wired
          screen="home"
          action="accept"
        />
        <DeviceNanoAction width={250} modelId="nanoS" wired screen="pin" />
      </NavigationScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  NavigationscrollView: {
    alignItems: "center",
  },
});
