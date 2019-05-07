// @flow
import React, { PureComponent } from "react";
import { StyleSheet, Animated } from "react-native";
import { SafeAreaView, withNavigation } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { compose } from "redux";
import { Trans } from "react-i18next";
import { connect } from "react-redux";
import { disconnect } from "@ledgerhq/live-common/lib/hw";
import { removeKnownDevices } from "../../actions/ble";

import Trash from "../../icons/Trash";
import Button from "../Button";

const AnimatedSafeView = Animated.createAnimatedComponent(SafeAreaView);

const forceInset = { bottom: "always" };

type Props = {
  navigation: NavigationScreenProp<*>,
  show: boolean,
  deviceIds: string[],
  removeKnownDevices: (deviceIds: string[]) => void,
  reset: () => void,
};

class RemoveDeviceButton extends PureComponent<Props> {
  opacity: * = new Animated.Value(0);

  toggleEditMode = () => {
    const n = this.props.navigation.dangerouslyGetParent();
    if (n) n.setParams({ editMode: false });
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

  onPress = async () => {
    this.props.removeKnownDevices(this.props.deviceIds);
    this.props.reset();
    this.hideButton();
    await Promise.all(
      this.props.deviceIds.map(id => disconnect(id).catch(() => {})),
    );
  };

  render() {
    const { deviceIds } = this.props;
    const count = deviceIds.length;

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
          i18nKey="RemoveDevice.button.title"
          values={{ nbDevices: count }}
          count={count}
        />
      );

    return (
      <AnimatedSafeView style={[styles.root, anim]} forceInset={forceInset}>
        <Button
          event="RemoveDeviceButton"
          type="alert"
          IconLeft={Trash}
          title={text}
          onPress={this.onPress}
          disabled={count === 0}
        />
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
    paddingBottom: 16,
  },
});

export default compose(
  connect(
    null,
    { removeKnownDevices },
  ),
  withNavigation,
)(RemoveDeviceButton);
