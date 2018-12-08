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
import Check from "../icons/Check";

export type Device = {
  id: string,
  name: string,
};

type Props = {
  device: Device,
  name: string,
  id: string,
  disabled?: boolean,
  withArrow?: boolean,
  description?: React$Node,
  onSelect?: Device => any,
  onForgetSelect?: string => any,
  selected?: boolean,
};

const iconByFamily = {
  httpdebug: "terminal",
};

export default class DeviceItem extends PureComponent<Props> {
  onPress = () => {
    const { device, onSelect } = this.props;
    invariant(onSelect, "onSelect required");
    return onSelect(device);
  };

  onForget = () => {
    const { device, onForgetSelect } = this.props;
    invariant(onForgetSelect, "onForget required");
    return onForgetSelect(device.id);
  };

  render() {
    const {
      name,
      id,
      disabled,
      onSelect,
      description,
      onForgetSelect,
      withArrow,
      selected,
    } = this.props;

    const family = id.split("|")[0];
    const iconName = family && iconByFamily[family];

    const edit = selected ? (
      <View style={styles.selectedIconWrapper}>
        <Check size={16} color={colors.white} />
      </View>
    ) : (
      <View style={styles.selectIconPlaceHolder} />
    );

    let res = (
      <View style={[styles.root, disabled && styles.rootDisabled]}>
        <IconNanoX
          color={colors.darkBlue}
          height={36}
          width={8}
          style={disabled ? styles.deviceIconDisabled : undefined}
        />
        {!iconName ? null : (
          <Icon
            style={styles.specialIcon}
            name={iconName}
            size={16}
            color={colors.darkBlue}
          />
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
        {onForgetSelect ? edit : null}
        {withArrow && !disabled ? (
          <IconArrowRight size={16} color={colors.grey} />
        ) : null}
      </View>
    );

    if (onSelect && !disabled && !onForgetSelect) {
      res = (
        <Touchable event="DeviceItemEnter" onPress={this.onPress}>
          {res}
        </Touchable>
      );
    } else if (onForgetSelect) {
      res = (
        <Touchable event="DeviceItemForget" onPress={this.onForget}>
          {res}
        </Touchable>
      );
    }

    return (
      <View style={styles.outer}>
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
    height: 64,
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
  specialIcon: {
    position: "absolute",
    left: 4,
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
    fontSize: 16,
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
  selectedIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    borderRadius: 50,
    backgroundColor: colors.live,
  },
  selectIconPlaceHolder: {
    width: 24,
    height: 24,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.fog,
  },
});
