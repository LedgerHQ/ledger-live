import React, { useCallback, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "~/context/Locale";
import { useTheme } from "@react-navigation/native";
import { TrackScreen, track } from "~/analytics";
import PreventNativeBack from "~/components/PreventNativeBack";
import ValidateSuccess from "~/components/ValidateSuccess";
import { ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import type { BondPublicFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<BondPublicFlowParamList, ScreenName.AleoBondPublicValidationSuccess>
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const onViewDetails = useCallback(() => {
    const result = route.params?.result;
    if (!result) return;
    navigation.navigate(ScreenName.OperationDetails, {
      accountId: route.params.accountId,
      operation: result,
    });
  }, [navigation, route.params]);

  useEffect(() => {
    track("staking_completed", { flow: "bond", currency: "aleo" });
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="BondPublicFlow" name="ValidationSuccess" flow="bond" currency="aleo" />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={onViewDetails}
        title={<Trans i18nKey="aleo.bond.validation.success.title" />}
        description={<Trans i18nKey="aleo.bond.validation.success.description" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
