// @flow
import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";

import { useTheme } from "@react-navigation/native";
import { rgba } from "../colors";
import CheckCircle from "../icons/CheckCircle";
import LText from "./LText";
import Button from "./Button";
import InfoBox from "./InfoBox";

type Props = {
  onClose?: () => void,
  onViewDetails?: () => void,
  title?: React$Node,
  description?: React$Node,
  primaryButton?: React$Node,
  secondaryButton?: React$Node,
  icon?: React$Node,
  iconColor?: string,
  info?: React$Node,
  onLearnMore?: () => void,
};

function ValidateSuccess({
  onClose,
  onViewDetails,
  title,
  description,
  primaryButton,
  secondaryButton,
  icon,
  iconColor: initialIconColor,
  info,
  onLearnMore,
}: Props) {
  const { colors } = useTheme();
  const iconColor = initialIconColor || colors.success;

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        <View style={[styles.icon, { backgroundColor: rgba(iconColor, 0.2) }]}>
          {icon || <CheckCircle size={40} color={colors.success} />}
        </View>
        <LText secondary semiBold style={styles.title}>
          {title || <Trans i18nKey="send.validation.sent" />}
        </LText>
        <LText style={styles.message} color="smoke">
          {description || <Trans i18nKey="send.validation.confirm" />}
        </LText>
        {info && <InfoBox onLearnMore={onLearnMore}>{info}</InfoBox>}
        {primaryButton ||
          (onViewDetails && (
            <Button
              event="SendSuccessViewDetails"
              title={<Trans i18nKey="send.validation.button.details" />}
              type="primary"
              containerStyle={styles.button}
              onPress={onViewDetails}
            />
          ))}
        {secondaryButton ||
          (onClose && (
            <Button
              event="SendSuccessClose"
              title={<Trans i18nKey="common.close" />}
              type="lightSecondary"
              containerStyle={styles.button}
              onPress={onClose}
            />
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    padding: 20,
    marginBottom: 32,
    borderRadius: 46,
  },
  title: {
    fontSize: 18,

    paddingHorizontal: 16,
    paddingBottom: 16,
    textAlign: "center",
  },
  button: {
    alignSelf: "stretch",
    marginTop: 24,
  },
  message: {
    fontSize: 14,
    paddingHorizontal: 16,
    marginBottom: 8,

    textAlign: "center",
  },
});

export default memo<Props>(ValidateSuccess);
