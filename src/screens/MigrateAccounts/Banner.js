// @flow

import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { NavigatorName } from "../../const";
import LText from "../../components/LText";
import IconArrowRight from "../../icons/ArrowRight";
import LiveLogo from "../../icons/LiveLogoIcon";
import { someAccountsNeedMigrationSelector } from "../../reducers/accounts";

export default function Banner() {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const someAccountsNeedMigration = useSelector(
    someAccountsNeedMigrationSelector,
  );

  const navigateToAccountMigration = useCallback(() => {
    navigation.navigate(NavigatorName.MigrateAccountsFlow);
  }, [navigation]);

  if (!someAccountsNeedMigration) return null;

  return (
    <TouchableOpacity
      style={[styles.root, { backgroundColor: colors.live }]}
      onPress={navigateToAccountMigration}
    >
      <View style={styles.logo}>
        <LiveLogo size={16} color={colors.white} />
      </View>
      <LText semiBold style={styles.text} color="white">
        <Trans i18nKey="migrateAccounts.banner" />
      </LText>
      <View style={styles.arrow}>
        <IconArrowRight size={16} color={colors.white} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    margin: 16,
    borderRadius: 4,
    flexDirection: "row",
    height: 48,
    display: "flex",
    alignItems: "center",
  },
  text: {
    marginLeft: 12,
    fontSize: 14,
    flex: 1,
    textAlign: "left",
  },
  logo: {
    marginLeft: 12,
  },
  arrow: {
    marginRight: 8,
  },
});
