// @flow

import React, { Component } from "react";
import { StyleSheet, View } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import LottieView from "lottie-react-native";
import Button from "../components/Button";
import LText from "../components/LText";
import { withTheme } from "../colors";

const forceInset = { bottom: "always" };

const anims = {
  pairing: {
    anim: require("../animations/pairing.json"),
    imageAssetsFolder: undefined,
  },
  line: {
    anim: require("../animations/line.json"),
    imageAssetsFolder: undefined,
  },
};

type State = {
  anim: ?("line" | "pairing"),
};

class DebugLottie extends Component<{ colors: * }, State> {
  state = {
    anim: null,
  };

  setAnimation = (anim: ?("line" | "pairing")) => this.setState({ anim });
  setParing = () => this.setAnimation("pairing");
  setLine = () => this.setAnimation("line");

  render() {
    const { anim } = this.state;
    const { colors } = this.props;
    return (
      <SafeAreaView
        forceInset={forceInset}
        style={[styles.root, { backgroundColor: colors.white }]}
      >
        <LText secondary semiBold style={styles.title}>
          Select Animation
        </LText>
        <View style={styles.select}>
          <Button
            containerStyle={styles.button}
            type="primary"
            event="DebugSwitchAnimation"
            title="pairing"
            onPress={this.setParing}
          />
          <Button
            containerStyle={styles.button}
            type="primary"
            event="DebugSwitchAnimation"
            title="line"
            onPress={this.setLine}
          />
        </View>
        <View style={{ flex: 1 }}>
          {anim ? (
            <LottieView
              source={anims[anim].anim}
              imageAssetsFolder={anims[anim].imageAssetsFolder}
              autoPlay
            />
          ) : null}
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  anim: {
    flex: 1,
  },
  title: {
    margin: 16,
    textAlign: "center",
  },
  select: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    marginHorizontal: 16,
  },
});

export default withTheme(DebugLottie);
