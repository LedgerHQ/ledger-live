// @flow

import React, { PureComponent } from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";

import IconCheck from "../icons/Check";

import colors from "../colors";

type Props = {
  isChecked: boolean,
  onChange?: boolean => void,
  disabled?: boolean,
  style: *,
};

export default class CheckBox extends PureComponent<Props> {
  onPress = () => {
    if (!this.props.onChange) return;
    this.props.onChange(!this.props.isChecked);
  };

  render() {
    const { isChecked, disabled, onChange, style } = this.props;

    const body = (
      <IconCheck
        size={16}
        color={colors.white}
        style={[!isChecked && styles.invisible]}
      />
    );

    const commonProps = {
      style: [styles.root, isChecked && styles.rootChecked, style],
    };

    if (onChange && !disabled) {
      return (
        <TouchableOpacity {...commonProps} onPress={this.onPress}>
          {body}
        </TouchableOpacity>
      );
    }

    return <View {...commonProps}>{body}</View>;
  }
}

const styles = StyleSheet.create({
  root: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.fog,
    borderRadius: 24,
  },
  rootChecked: {
    backgroundColor: colors.live,
    borderWidth: 0,
  },
  invisible: {
    opacity: 0,
  },
});
