// @flow
import React from "react";
import { Trans } from "react-i18next";
import SafeAreaView from "react-native-safe-area-view";
import { StyleSheet, View } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";

import { ScreenName, NavigatorName } from "../../const";
import Button from "../../components/Button";
import LText from "../../components/LText";
import { TrackScreen } from "../../analytics";
import { MANAGER_TABS } from "../Manager/Manager";
import AppIcon from "../Manager/AppsList/AppIcon";

const MissingOrOutdatedSwapApp = ({
  outdated = false,
}: {
  outdated?: boolean,
}) => {
  const { colors } = useTheme();
  const { navigate } = useNavigation();
  const onPress = () => {
    navigate(NavigatorName.Manager, {
      screen: ScreenName.Manager,
      params: outdated
        ? {
            tab: MANAGER_TABS.INSTALLED_APPS,
            updateModalOpened: true,
          }
        : { searchQuery: "Exchange" },
    });
  };

  const key = outdated ? "outdatedApp" : "missingApp";

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="Swap" name="MissingOrOutdatedExchangeApp" />
      <View style={styles.illustration}>
        <AppIcon size={60} icon="exchange" />
      </View>
      <LText secondary style={styles.title}>
        <Trans i18nKey={`transfer.swap.${key}.title`} />
      </LText>
      <LText primary style={styles.description} color="smoke">
        <Trans i18nKey={`transfer.swap.${key}.description`} />
      </LText>
      <Button
        event="MissingSwapAppPlaceholderGoToManager"
        type={"primary"}
        title={<Trans i18nKey={`transfer.swap.${key}.button`} />}
        onPress={onPress}
        containerStyle={styles.button}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  wrapper: {
    flexGrow: 1,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  illustration: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 11,
    marginHorizontal: 40,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    width: "100%",
  },
});

export default MissingOrOutdatedSwapApp;
