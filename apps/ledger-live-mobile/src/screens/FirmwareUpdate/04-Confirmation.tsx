import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trans } from "react-i18next";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../analytics";
import { ScreenName } from "../../const";
import GenericSuccessView from "../../components/GenericSuccessView";
import Button from "../../components/Button";
import type { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import { FirmwareUpdateNavigatorParamList } from "../../components/RootNavigator/types/FirmwareUpdateNavigator";
import { ManagerNavigatorStackParamList } from "../../components/RootNavigator/types/ManagerNavigator";

type Navigation = CompositeScreenProps<
  StackNavigatorProps<
    FirmwareUpdateNavigatorParamList,
    ScreenName.FirmwareUpdateConfirmation
  >,
  StackNavigatorProps<ManagerNavigatorStackParamList>
>;
type Props = Navigation;

export default function FirmwareUpdateConfirmation({ navigation }: Props) {
  const { colors } = useTheme();
  const onClose = useCallback(() => {
    navigation.navigate(ScreenName.Manager);
  }, [navigation]);
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="FirmwareUpdate" name="Confirmation" />
      <View style={styles.body}>
        <GenericSuccessView
          title={<Trans i18nKey="FirmwareUpdateConfirmation.title" />}
          description={
            <Trans i18nKey="FirmwareUpdateConfirmation.description" />
          }
        />
        <Button
          event="FirmwareUpdateDone"
          type="primary"
          onPress={onClose}
          title={<Trans i18nKey="common.close" />}
          containerStyle={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    padding: 20,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 46,
  },
  title: {
    fontSize: 18,
    paddingHorizontal: 16,
    paddingBottom: 16,
    textAlign: "center",
  },
  button: {
    alignSelf: "stretch",
    marginTop: 16,
  },
});
