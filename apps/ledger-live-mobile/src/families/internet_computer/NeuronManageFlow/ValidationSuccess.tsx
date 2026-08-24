import { useTheme } from "@react-navigation/native";
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { TrackScreen } from "~/analytics";
import Button from "~/components/Button";
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
import type { InternetComputerNeuronManageFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<
    InternetComputerNeuronManageFlowParamList,
    ScreenName.InternetComputerNeuronValidationSuccess
  >
>;

/**
 * One confirmation screen for every neuron operation: which one ran is read from the transaction, so
 * the copy comes from a per-operation translation key rather than a screen per operation.
 */
export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const action = route.params.transaction?.type;

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  // Back to the list rather than closing: the point of the flow is managing several neurons.
  const onBackToNeurons = useCallback(
    () =>
      navigation.navigate(ScreenName.InternetComputerNeuronList, {
        accountId: route.params.accountId,
        parentId: route.params.parentId,
      }),
    [navigation, route.params.accountId, route.params.parentId],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="Manage Neurons ICP Flow"
        name="ValidationSuccess"
        flow="stake"
        action={action}
      />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        title={t("internetComputer.manageNeuronFlow.confirmation.success.title")}
        description={t(
          `internetComputer.manageNeuronFlow.confirmation.success.${action}`,
          t("internetComputer.manageNeuronFlow.confirmation.success.default"),
        )}
        primaryButton={
          <Button
            type="main"
            onPress={onBackToNeurons}
            mt={6}
            testID="icp-back-to-neurons-button"
            title={t("internetComputer.manageNeuronFlow.confirmation.backToNeurons")}
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
