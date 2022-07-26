// @flow
import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { Operation } from "@ledgerhq/live-common/types/index";
import { useTheme } from "@react-navigation/native";

import { accountScreenSelector } from "../../../../../reducers/accounts";
import { TrackScreen } from "../../../../../analytics";
import { ScreenName } from "../../../../../const";
import PreventNativeBack from "../../../../../components/PreventNativeBack";
import ValidateSuccess from "../../../../../components/ValidateSuccess";

interface Props {
  navigation: any;
  route: { params: RouteParams };
}

interface RouteParams {
  accountId: string;
  deviceId: string;
  transaction: any;
  result: Operation;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

const Success = (props: Props) => {
  const { navigation, route } = props;
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));

  const onClose = useCallback(() => {
    navigation.getParent().pop();
  }, [navigation]);

  const goToOperationDetails = useCallback(() => {
    if (!account) return;

    const result = route.params?.result;
    if (!result) return;

    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      operation: result,
    });
  }, [account, route.params, navigation]);

  const mode = route.params.transaction.mode;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="ElrondClaimRewards" name="ValidationSuccess" />

      <PreventNativeBack />

      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={
          <Trans
            i18nKey={`elrond.claimRewards.flow.steps.verification.success.title${
              mode !== "claimRewards" ? "reDelegateRewards" : ""
            }`}
          />
        }
        description={
          <Trans i18nKey="elrond.claimRewards.flow.steps.verification.success.text" />
        }
      />
    </View>
  );
};

export default Success;
