// @flow

import React, { PureComponent } from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";

import LText from "../../components/LText";
import colors, { rgba } from "../../colors";
import IconCheck from "../../icons/Check";

type Props = {
  onPress: () => void,
  isChecked?: boolean,
  children: *,
};

class OnboardingChoice extends PureComponent<Props> {
  render() {
    const { onPress, children, isChecked } = this.props;
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.root, isChecked && styles.rootChecked]}
      >
        <View style={styles.inner}>
          <LText
            semiBold={isChecked}
            style={[styles.text, isChecked && styles.textChecked]}
          >
            {children}
          </LText>
        </View>
        {isChecked && (
          <View style={styles.checkContainer}>
            <IconCheck size={16} color={colors.live} />
          </View>
        )}
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderColor: colors.fog,
    padding: 16,
    borderRadius: 4,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  rootChecked: {
    borderColor: colors.live,
    backgroundColor: rgba(colors.live, 0.1),
  },
  inner: {
    flexGrow: 1,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.grey,
  },
  textChecked: {
    color: colors.live,
  },
  checkContainer: {
    marginLeft: 16,
  },
});

export default OnboardingChoice;
