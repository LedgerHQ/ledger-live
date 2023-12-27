import React, { useCallback, useEffect, useMemo } from "react";
import { View } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";

import { accountScreenSelector } from "~/reducers/accounts";
import { TrackScreen, track } from "~/analytics";
import { ScreenName } from "~/const";
import PreventNativeBack from "~/components/PreventNativeBack";
import ValidateSuccess from "~/components/ValidateSuccess";

import type { ValidationSuccessPropsType } from "./types";
import type { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

import styles from "./styles";

/*
 * Handle the component declaration.
 */

const ValidationSuccess = ({ navigation, route }: ValidationSuccessPropsType) => {
  const { params } = route;
  const { result } = params;

  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const { ticker } = getAccountCurrency(account);

  const parent = useMemo<StackNavigatorNavigation<BaseNavigatorStackParamList>>(
    () => navigation.getParent(),
    [navigation],
  );

  const validator = useMemo(() => {
    const voteAccAddress = route.params.transaction.recipient;
    const chosenValidator = route.params.validators.find(v => v.contract === voteAccAddress);
    return chosenValidator?.identity?.name ?? voteAccAddress;
  }, [route.params.transaction, route.params.validators]);
  const source = route.params.source?.name ?? "unknown";

  useEffect(() => {
    track("staking_completed", {
      currency: ticker,
      validator,
      source,
      delegation: "delegation",
      flow: "stake",
    });
  }, [source, validator, ticker]);

  /*
   * Should the validation fail, close all stacks, on callback click.
   */
  const onClose = useCallback(() => {
    if (parent) {
      parent.pop();
    }
  }, [parent]);

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
      <TrackScreen
        category="ElrondDelegation"
        name="ValidationSuccess"
        flow="stake"
        action="delegate"
        currency="egld"
      />
      <PreventNativeBack />

      <ValidateSuccess
        iconBoxSize={64}
        iconSize={24}
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={<Trans i18nKey="elrond.delegation.flow.steps.verification.success.title" />}
        description={<Trans i18nKey="elrond.delegation.flow.steps.verification.success.text" />}
      />
    </View>
  );
};

export default ValidationSuccess;
