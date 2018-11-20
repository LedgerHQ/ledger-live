// @flow
import React, { PureComponent } from "react";
import { StyleSheet, TouchableOpacity, Animated } from "react-native";
import { SafeAreaView, withNavigation } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { compose } from "redux";
import { Trans } from "react-i18next";
import { connect } from "react-redux";

import { removeKnownDevices } from "../../actions/ble";

import Trash from "../../icons/Trash";
import colors from "../../colors";
import LText from "../LText/index";

const AnimatedSafeView = Animated.createAnimatedComponent(SafeAreaView);

const forceInset = { bottom: "always" };

type Device = string;

type Props = {
  navigation: NavigationScreenProp<*>,
  show: boolean,
  devices: Array<Device>,
  removeKnownDevices: (devicesId: Array<Device>) => void,
  reset: () => void,
};

class RemoveDeviceButton extends PureComponent<Props> {
  opacity: * = new Animated.Value(0);

  toggleEditMode = () => {
    this.props.navigation.dangerouslyGetParent().setParams({ editMode: false });
    this.props.navigation.setParams({ editMode: false });
  };

  showbutton = () => {
    Animated.timing(this.opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  hideButton = () => {
    Animated.timing(this.opacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(this.toggleEditMode);
  };

  componentDidUpdate({ show: prevShow }: Props) {
    const { show } = this.props;
    if (show && !prevShow) {
      this.showbutton();
    } else if (!show && prevShow) {
      this.hideButton();
    }
  }

  onPress = () => {
    this.props.removeKnownDevices(this.props.devices);
    this.props.reset();
    this.hideButton();
  };

  render() {
    const { devices } = this.props;
    const count = devices.length;

    const anim = {
      transform: [
        {
          translateY: this.opacity.interpolate({
            inputRange: [0, 1],
            outputRange: [100, -100],
            extrapolate: "clamp",
          }),
        },
      ],
    };

    const text =
      count === 0 ? (
        <Trans i18nKey="common.delete" />
      ) : (
        <Trans
          i18nKey="UnpairDevice.button.title"
          values={{ nbDevices: count }}
          count={count}
        />
      );

    return (
      <AnimatedSafeView style={[styles.root, anim]} forceInset={forceInset}>
        <TouchableOpacity
          style={[styles.button, count > 0 ? styles.active : null]}
          onPress={this.onPress}
        >
          <Trash size={16} color={colors.white} />
          <LText semiBold style={styles.text}>
            {text}
          </LText>
        </TouchableOpacity>
      </AnimatedSafeView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -100,
    paddingHorizontal: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    backgroundColor: colors.grey,
    borderRadius: 4,
  },
  active: {
    backgroundColor: colors.alert,
  },
  text: {
    paddingLeft: 8,
    fontSize: 16,
    color: colors.white,
  },
});

export default compose(
  connect(
    null,
    { removeKnownDevices },
  ),
  withNavigation,
)(RemoveDeviceButton);
