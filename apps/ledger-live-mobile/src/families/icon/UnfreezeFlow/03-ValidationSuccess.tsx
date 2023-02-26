import type { Transaction as IconTransaction } from "@ledgerhq/live-common/families/icon/types";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import { TrackScreen } from "../../../analytics";
import PreventNativeBack from "../../../components/PreventNativeBack";
import { BaseNavigatorStackParamList } from "../../../components/RootNavigator/types/BaseNavigator";
import { StackNavigatorNavigation, StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import ValidateSuccess from "../../../components/ValidateSuccess";
import { ScreenName } from "../../../const";
import { accountScreenSelector } from "../../../reducers/accounts";
import { IconUnfreezeFlowParamList } from "./type";

type Props = CompositeScreenProps<
  StackNavigatorProps<
    IconUnfreezeFlowParamList,
    ScreenName.IconUnfreezeValidationSuccess
  >,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const transaction = route.params.transaction;
  const onClose = useCallback(() => {
    navigation
      .getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>()
      .pop();
  }, [navigation]);
  const goToOperationDetails = useCallback(() => {
    if (!account) return;
    const result = route.params.result;
    if (!result) return;
    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      operation: result,
    });
  }, [navigation, account, route.params.result]);
  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="IconUnfreezeFlow" name="IconValidationSuccess" />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={<Trans i18nKey="icon.unfreeze.steps.validation.title" />}
        description={
          <Trans
            i18nKey="icon.unfreeze.steps.validation.success.text"
            values={transaction.amount}
          />
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
