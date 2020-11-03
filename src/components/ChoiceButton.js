/* @flow */
import React from "react";
import { View, StyleSheet } from "react-native";

import LText from "./LText";
import Touchable from "./Touchable";
import colors from "../colors";

type ChoiceButtonProps = {
  disabled: boolean,
  onSelect: Function,
  label: React$Node,
  description: React$Node,
  Icon: any,
  extra?: React$Node,
  event?: string,
  eventProperties: *,
  navigationParams?: [*],
  enableActions?: string,
};

const ChoiceButton = ({
  event,
  eventProperties,
  disabled,
  label,
  description,
  Icon,
  extra,
  onSelect,
  navigationParams,
  enableActions,
}: ChoiceButtonProps) => (
  <Touchable
    event={event}
    eventProperties={eventProperties}
    style={styles.button}
    disabled={disabled}
    onPress={() => onSelect({ navigationParams, enableActions })}
  >
    <View
      style={[
        styles.buttonIcon,
        disabled ? { backgroundColor: colors.lightFog } : {},
      ]}
    >
      <Icon color={disabled ? colors.grey : colors.live} size={18} />
    </View>

    <View style={styles.buttonLabelContainer}>
      <LText
        style={[styles.buttonLabel, disabled ? styles.disabledButton : {}]}
        semiBold
      >
        {label}
      </LText>
      {description && <LText style={[styles.buttonDesc]}>{description}</LText>}
    </View>
    {extra && <View style={styles.extraButton}>{extra}</View>}
  </Touchable>
);

export default ChoiceButton;

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: "auto",
    marginVertical: 8,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  buttonIcon: {
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: colors.lightLive,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonLabelContainer: {
    flex: 1,
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    marginHorizontal: 10,
  },
  buttonLabel: {
    color: colors.darkBlue,
    fontSize: 18,
    lineHeight: 22,
  },
  buttonDesc: {
    color: colors.grey,
    fontSize: 13,
    lineHeight: 16,
  },
  extraButton: {
    flexShrink: 1,
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "flex-end",
  },
  disabledButton: {
    color: colors.grey,
  },
});
