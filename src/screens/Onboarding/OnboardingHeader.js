// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";

import colors from "../../colors";
import LText from "../../components/LText";

type Props = {
  title: string,
  step: number,
  nbSteps: number,
  onBack: () => void,
};

class OnboardingHeader extends PureComponent<Props> {
  render() {
    const { title, step, nbSteps, onBack } = this.props;
    const stepMsg = `${step} of ${nbSteps}`; // TODO translate
    return (
      <View style={styles.root}>
        <TouchableOpacity style={styles.arrow} onPress={onBack} />
        <LText semiBold style={styles.steps}>
          {stepMsg}
        </LText>
        <LText secondary semiBold style={styles.title}>
          {title}
        </LText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
  },
  arrow: {
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: colors.lightFog,
    marginBottom: 16,
  },
  steps: {
    color: colors.grey,
    fontSize: 12,
  },
  title: {
    color: colors.darkBlue,
    fontSize: 24,
    lineHeight: 36,
  },
});

export default OnboardingHeader;
