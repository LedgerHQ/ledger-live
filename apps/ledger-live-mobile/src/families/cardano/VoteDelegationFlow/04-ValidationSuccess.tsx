import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "~/context/Locale";
import { useTheme } from "@react-navigation/native";
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
import { CardanoVoteDelegationFlowParamList } from "./types";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

type Props = BaseComposite<
  StackNavigatorProps<
    CardanoVoteDelegationFlowParamList,
    ScreenName.CardanoVoteDelegationValidationSuccess
  >
>;

export default function VoteDelegationValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useAccountScreen(route);

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
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

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="VoteDelegationFlow" name="ValidationSuccess" />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={
          <Trans
            i18nKey="cardano.voteDelegation.flow.steps.confirmation.success.title"
            defaults="Vote Delegation Successful"
          />
        }
        description={
          <Trans
            i18nKey="cardano.voteDelegation.flow.steps.confirmation.success.text"
            defaults="You have successfully delegated your vote."
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
