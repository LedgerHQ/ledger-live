import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trans } from "react-i18next";
import GenericErrorView from "../../components/GenericErrorView";
import Button from "../../components/Button";
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import type { SwapNavigatorParamList } from "../../components/RootNavigator/types/SwapNavigator";
import type {
  StackNavigatorNavigation,
  StackNavigatorRoute,
} from "../../components/RootNavigator/types/helpers";

const Error = () => {
  const { colors } = useTheme();
  const navigation =
    useNavigation<
      StackNavigatorNavigation<SwapNavigatorParamList, ScreenName.SwapError>
    >();
  const route =
    useRoute<
      StackNavigatorRoute<SwapNavigatorParamList, ScreenName.SwapError>
    >();
  const onRetry = useCallback(() => {
    navigation.navigate(ScreenName.SwapForm);
  }, [navigation]);
  const { error } = route.params;
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="Swap" name={`SwapModalError-${error.name}`} />
      <View style={styles.wrapper}>
        <GenericErrorView error={error} />
      </View>
      <Button
        type={"primary"}
        onPress={onRetry}
        title={<Trans i18nKey="common.retry" />}
        event={"SwapErrorRetry"}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  wrapper: {
    flex: 1,
    justifyContent: "center",
  },
});
export default Error;
