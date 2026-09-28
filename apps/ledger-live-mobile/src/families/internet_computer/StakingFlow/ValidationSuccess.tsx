import { useTheme } from "@react-navigation/native";
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { TrackScreen } from "~/analytics";
import PreventNativeBack from "~/components/PreventNativeBack";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import ValidateSuccess from "~/components/ValidateSuccess";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import type { InternetComputerStakingFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<
    InternetComputerStakingFlowParamList,
    ScreenName.InternetComputerStakingValidationSuccess
  >
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const goToOperationDetails = useCallback(() => {
    const { accountId, result } = route.params;
    if (!result) return;
    navigation.navigate(ScreenName.OperationDetails, { accountId, operation: result });
  }, [navigation, route.params]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="Staking ICP Flow"
        name="ValidationSuccess"
        flow="stake"
        action="create_neuron"
      />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={t("internetComputer.stakingFlow.success.title")}
        // The neuron is not listed until a device-signed list_neurons fetches it, so the copy sends
        // the user to Manage Neurons rather than implying it will appear on its own.
        description={t("internetComputer.stakingFlow.success.description")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
