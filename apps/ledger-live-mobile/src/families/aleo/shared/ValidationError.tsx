import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import { useTheme } from "styled-components/native";
import SafeAreaView from "~/components/SafeAreaView";
import { TrackScreen } from "~/analytics";
import ValidateError from "~/components/ValidateError";
import type { LedgerError } from "~/types/error";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";

type Props = Readonly<{
  navigation: NavigationProp<ParamListBase>;
  error: LedgerError;
  category: string;
  flow: string;
  action: string;
}>;

export default function AleoValidationError({ navigation, error, category, flow, action }: Props) {
  const { colors } = useTheme();

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>()?.pop();
  }, [navigation]);

  const onRetry = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background.main }]}>
      <TrackScreen
        category={category}
        name="ValidationError"
        flow={flow}
        action={action}
        currency="aleo"
      />
      <ValidateError error={error} onRetry={onRetry} onClose={onClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
