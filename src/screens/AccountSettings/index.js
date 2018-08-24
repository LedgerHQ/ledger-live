/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { translate } from "react-i18next";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { NavigationScreenProp } from "react-navigation";
import HeaderRightClose from "../../components/HeaderRightClose";
import type { T } from "../../types/common";
import SettingsRow from "../../components/SettingsRow";
import LText from "../../components/LText";
import colors from "../../colors";
import Trash from "../../images/icons/Trash";
import Archive from "../../images/icons/Archive";

type Props = {
  navigation: NavigationScreenProp<{
    account: Account,
  }>,
  t: T,
};

class AccountSettings extends Component<Props> {
  static navigationOptions = ({ navigation }: *) => ({
    title: "Account Settings",
    headerRight: <HeaderRightClose navigation={navigation} />,
    headerLeft: null,
  });

  render() {
    const { navigation, t } = this.props;
    const account = navigation.getParam("account", {});
    return (
      <View>
        <View style={styles.sectionRow}>
          <SettingsRow
            title={t("common:account.settings.accountName.title")}
            desc={t("common:account.settings.accountName.desc")}
            arrowRight
            onPress={() => navigation.navigate("")}
          >
            <LText
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.accountName}
            >
              {account.name}
            </LText>
          </SettingsRow>
          <SettingsRow
            title={t("common:account.settings.unit.title")}
            desc={t("common:account.settings.unit.desc")}
            arrowRight
            onPress={() => navigation.navigate("")}
          >
            <LText style={{ color: colors.grey }}>{account.unit.code}</LText>
          </SettingsRow>
        </View>
        <View style={styles.sectionRow}>
          <SettingsRow
            title={t("common:account.settings.archive.title")}
            desc={t("common:account.settings.archive.desc")}
            iconLeft={
              <IconLeft
                bgIconContainer="rgba(153,153,153,0.1)"
                icon={<Archive size={16} color={colors.grey} />}
              />
            }
            onPress={() => navigation.navigate("")}
          />
          <SettingsRow
            title={t("common:account.settings.delete.title")}
            desc={t("common:account.settings.delete.desc")}
            iconLeft={
              <IconLeft
                bgIconContainer="rgba(234,46,73,0.1)"
                icon={<Trash size={16} color={colors.alert} />}
              />
            }
            onPress={() => navigation.navigate("")}
            titleStyle={{ color: colors.alert }}
          />
        </View>
      </View>
    );
  }
}

export default translate()(AccountSettings);

export function IconLeft({
  icon,
  bgIconContainer,
}: {
  icon: any,
  bgIconContainer: string,
}) {
  return (
    <View style={[styles.iconContainer, { backgroundColor: bgIconContainer }]}>
      {icon}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionRow: {
    marginTop: 16,
  },
  iconContainer: {
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    height: 32,
    width: 32,
  },
  accountName: {
    flex: 4,
    flexShrink: 1,
    color: colors.grey,
  },
});
