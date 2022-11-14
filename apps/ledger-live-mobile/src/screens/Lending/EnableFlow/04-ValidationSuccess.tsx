import React, { useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../../analytics";
import PreventNativeBack from "../../../components/PreventNativeBack";
import ValidateSuccess from "../../../components/ValidateSuccess";
import UpdateIcon from "../../../icons/Update";
import { urls } from "../../../config/urls";
import {
  StackNavigatorProps,
  StackNavigatorNavigation,
} from "../../../components/RootNavigator/types/helpers";
import { LendingEnableFlowParamsList } from "../../../components/RootNavigator/types/LendingEnableFlowNavigator";
import { ScreenName } from "../../../const";
import { BaseNavigatorStackParamList } from "../../../components/RootNavigator/types/BaseNavigator";

type Props = StackNavigatorProps<
  LendingEnableFlowParamsList,
  ScreenName.LendingEnableValidationSuccess
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const onClose = useCallback(() => {
    const n =
      navigation.getParent<
        StackNavigatorNavigation<BaseNavigatorStackParamList>
      >() || navigation;
    n.pop();
  }, [navigation]);
  const { currency } = route.params;
  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen
        category="Lend Approve"
        name="Success"
        eventProperties={{
          currencyName: currency?.name,
        }}
      />
      <PreventNativeBack />
      <ValidateSuccess
        icon={<UpdateIcon size={24} color={colors.live} />}
        iconColor={colors.live}
        title={<Trans i18nKey="transfer.lending.enable.validation.success" />}
        description={
          <Trans i18nKey="transfer.lending.enable.validation.info" />
        }
        info={<Trans i18nKey="transfer.lending.enable.validation.extraInfo" />}
        onLearnMore={() => {
          Linking.openURL(urls.approvedOperation);
        }}
        onClose={onClose}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
