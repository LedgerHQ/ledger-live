import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import type { Operation } from "@ledgerhq/types-live";
import { TrackScreen } from "~/analytics";
import PreventNativeBack from "~/components/PreventNativeBack";
import ValidateSuccess from "~/components/ValidateSuccess";
import { ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";

type Props = Readonly<{
  navigation: StackNavigatorNavigation<BaseNavigatorStackParamList>;
  accountId: string;
  result: Operation;
  category: string;
  flow: string;
  action: string;
  title: React.ReactNode;
  description: React.ReactNode;
}>;

export default function AleoValidationSuccess({
  navigation,
  accountId,
  result,
  category,
  flow,
  action,
  title,
  description,
}: Props) {
  const { colors } = useTheme();

  const onClose = useCallback(() => {
    navigation.pop();
  }, [navigation]);

  const onViewDetails = useCallback(() => {
    navigation.navigate(ScreenName.OperationDetails, { accountId, operation: result });
  }, [navigation, accountId, result]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category={category}
        name="ValidationSuccess"
        flow={flow}
        action={action}
        currency="aleo"
      />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={onViewDetails}
        title={title}
        description={description}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
