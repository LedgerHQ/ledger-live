// @flow

import React, { PureComponent } from "react";
import { StyleSheet, View } from "react-native";
import { translate, Trans } from "react-i18next";
import BottomModal from "../BottomModal";
import LText from "../LText";
import TranslatedError from "../TranslatedError";
import ErrorIcon from "../ErrorIcon";
import Close from "../../icons/Close";
import Touchable from "../Touchable";
import Button from "../Button";
import colors from "../../colors";
import type { Step } from "./types";

const RenderError = ({
  error,
  onRetry,
}: {
  error: Error,
  onRetry: () => void,
}) => (
  <View style={styles.root}>
    <View style={styles.headIcon}>
      <ErrorIcon error={error} />
    </View>
    <LText secondary bold style={styles.title}>
      <TranslatedError error={error} />
    </LText>
    <LText style={styles.description}>
      <TranslatedError error={error} field="description" />
    </LText>
    <Button
      type="secondary"
      title={<Trans i18nKey="common.retry" />}
      containerStyle={styles.retryButton}
      onPress={onRetry}
    />
  </View>
);

const RenderStep = ({ step }: { step: Step }) => (
  <View style={styles.root}>
    <View style={styles.headIcon}>{step.icon}</View>
    <LText secondary bold style={styles.title}>
      {step.title}
    </LText>
    <LText style={styles.description}>{step.description}</LText>
  </View>
);

class SelectDeviceConnectModal extends PureComponent<{
  isOpened: boolean,
  onClose: () => void,
  onRetry: () => void,
  step: Step,
  error: ?Error,
}> {
  render() {
    const { isOpened, onClose, onRetry, error, step } = this.props;

    return (
      <BottomModal isOpened={isOpened} onClose={onClose}>
        {error ? (
          <RenderError error={error} onRetry={onRetry} />
        ) : (
          <RenderStep step={step} />
        )}
        <Touchable style={styles.close} onPress={onClose}>
          <Close color={colors.fog} size={20} />
        </Touchable>
      </BottomModal>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    alignItems: "center",
    padding: 20,
  },
  close: {
    position: "absolute",
    right: 10,
    top: 10,
  },
  headIcon: {
    padding: 10,
  },
  title: {
    marginBottom: 10,
    fontSize: 18,
    color: colors.black,
  },
  description: {
    fontSize: 14,
    color: colors.grey,
  },
  retryButton: {
    marginTop: 20,
    alignSelf: "stretch",
  },
});

export default translate()(SelectDeviceConnectModal);
