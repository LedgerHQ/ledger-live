import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";

import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import type { HederaAssociateTokenFlowParamList } from "./types";
import { TrackScreen } from "~/analytics";
import { ScreenName } from "~/const";
import PreventNativeBack from "~/components/PreventNativeBack";
import ValidateSuccess from "~/components/ValidateSuccess";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useAccountScreen } from "~/hooks/useAccountScreen";

type Props = BaseComposite<
  StackNavigatorProps<
    HederaAssociateTokenFlowParamList,
    ScreenName.HederaAssociateTokenValidationSuccess
  >
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useAccountScreen(route);

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const goToOperationDetails = useCallback(() => {
    const result = route.params?.result;
    if (!account || !result) return;

    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      operation: result,
    });
  }, [account, route.params, navigation]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="AssociateTokenFlow" name="ValidationSuccess" currency="hedera" />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={<Trans i18nKey="hedera.associate.validationSuccess.title" />}
        description={<Trans i18nKey="hedera.associate.validationSuccess.text" />}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
