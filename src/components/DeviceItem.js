// @flow

import React, { PureComponent } from "react";
import invariant from "invariant";
import { View, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/dist/Feather";
import Touchable from "./Touchable";
import LText from "./LText";
import colors from "../colors";
import IconNanoX from "../icons/NanoX";
import IconArrowRight from "../icons/ArrowRight";

export type Device = {
  id: string,
  name: string,
};

type Props<T> = {
  device: T,
  name: string,
  family?: ?string,
  disabled?: boolean,
  description?: string,
  onSelect?: T => any,
  onForget?: T => any,
};

const iconByFamily = {
  httpdebug: "terminal",
};

export default class DeviceItem<T> extends PureComponent<Props<T>> {
  onPress = () => {
    const { device, onSelect } = this.props;
    invariant(onSelect, "onSelect required");
    return onSelect(device);
  };

  onForget = () => {
    const { device, onForget } = this.props;
    invariant(onForget, "onForget required");
    return onForget(device);
  };

  render() {
    const {
      name,
      family,
      disabled,
      onSelect,
      description,
      onForget,
    } = this.props;

    const iconName = family && iconByFamily[family];

    let res = (
      <View style={[styles.root, disabled && styles.rootDisabled]}>
        {!iconName ? (
          <IconNanoX
            color={colors.darkBlue}
            height={36}
            width={8}
            style={disabled ? styles.deviceIconDisabled : undefined}
          />
        ) : (
          <Icon name={iconName} size={32} color={colors.darkBlue} />
        )}
        <View style={styles.content}>
          <LText
            bold
            numberOfLines={1}
            style={[
              styles.deviceNameText,
              disabled && styles.deviceNameTextDisabled,
            ]}
          >
            {name}
          </LText>
          {description ? (
            <LText
              numberOfLines={1}
              style={[
                styles.descriptionText,
                disabled && styles.descriptionTextDisabled,
              ]}
            >
              {description}
            </LText>
          ) : null}
        </View>
        {!disabled && <IconArrowRight size={16} color={colors.grey} />}
      </View>
    );

    if (onSelect && !disabled) {
      res = <Touchable onPress={this.onPress}>{res}</Touchable>;
    }

    let prepend = null;

    if (onForget) {
      prepend = (
        <Touchable onPress={this.onForget}>
          <LText style={styles.forget}>
            <Icon name="crosshair" size={24} color={colors.black} />
          </LText>
        </Touchable>
      );
    }

    return (
      <View style={styles.outer}>
        {prepend}
        <View style={styles.inner}>{res}</View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  outer: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  inner: {
    flex: 1,
  },
  forget: {
    paddingRight: 16,
  },
  root: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderColor: colors.fog,
    borderWidth: 1,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  rootDisabled: {
    borderWidth: 0,
    backgroundColor: colors.lightGrey,
  },
  content: {
    flexDirection: "column",
    justifyContent: "center",
    flexGrow: 1,
    marginLeft: 24,
  },
  deviceIconDisabled: {
    opacity: 0.4,
  },
  deviceNameText: {
    fontSize: 14,
    color: colors.darkBlue,
  },
  deviceNameTextDisabled: {
    color: colors.grey,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.darkBlue,
  },
  descriptionTextDisabled: {
    color: colors.grey,
  },
});
