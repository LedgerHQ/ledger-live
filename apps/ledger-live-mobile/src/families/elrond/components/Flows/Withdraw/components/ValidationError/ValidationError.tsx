import React, { useCallback } from "react";
import { View } from "react-native";
import { useTheme, StackActions } from "@react-navigation/native";

import ValidateError from "../../../../../../../components/ValidateError";
import { TrackScreen } from "../../../../../../../analytics";

import type { ValidationErrorPropsType } from "./types";

import styles from "./styles";

/*
 * Handle the component declaration.
 */

const ValidationError = (props: ValidationErrorPropsType) => {
  const { navigation, route } = props;
  const { error } = route.params;
  const { colors } = useTheme();

  /*
   * Should the validation fail, close all stacks, on callback click.
   */

  const onClose = useCallback(() => {
    if (navigation) {
      navigation.dispatch(StackActions.popToTop());
      navigation.goBack();
    }
  }, [navigation]);

  /*
   * Should the validation fail for whatever reason, go back one stack, on callback.
   */

  const retry = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  /*
   * Return the rendered component.
   */

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="ElrondWithdraw" name="ValidationError" />
      <ValidateError error={error} onRetry={retry} onClose={onClose} />
    </View>
  );
};

export default ValidationError;
