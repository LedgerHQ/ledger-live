// @flow

import React, { useCallback } from "react";
import { View } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { useTheme, StackActions } from "@react-navigation/native";

import { accountScreenSelector } from "../../../../../../../reducers/accounts";
import { TrackScreen } from "../../../../../../../analytics";
import { ScreenName } from "../../../../../../../const";
import PreventNativeBack from "../../../../../../../components/PreventNativeBack";
import ValidateSuccess from "../../../../../../../components/ValidateSuccess";

import type { ValidationSuccessPropsType } from "./types";

import styles from "./styles";

/*
 * Handle the component declaration.
 */

const ValidationSuccess = (props: ValidationSuccessPropsType) => {
  const { navigation, route } = props;
  const { params } = route;
  const { result } = params;

  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));

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
   * Callback taking the user to the operation details panel, on successful operation.
   */

  const goToOperationDetails = useCallback(() => {
    if (!account || !result) {
      return;
    }

    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      operation: result,
    });
  }, [account, result, navigation]);

  /*
   * Return the rendered component.
   */

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="ElrondDelegation" name="ValidationSuccess" />
      <PreventNativeBack />

      <ValidateSuccess
        iconBoxSize={64}
        iconSize={24}
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={
          <Trans i18nKey="elrond.delegation.flow.steps.verification.success.title" />
        }
        description={
          <Trans i18nKey="elrond.delegation.flow.steps.verification.success.text" />
        }
      />
    </View>
  );
};

export default ValidationSuccess;
