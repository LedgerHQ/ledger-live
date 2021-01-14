/* @flow */
import React from "react";
import { StyleSheet, Linking } from "react-native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/dist/Feather";
import { useTheme } from "@react-navigation/native";
import NavigationScrollView from "../../components/NavigationScrollView";
import BottomModalChoice from "../../components/BottomModalChoice";
import IconHelp from "../../icons/Help";
import IconDevice2 from "../../icons/Device2";
import IconAcademy from "../../icons/Academy";
import IconFacebook from "../../icons/Facebook";
import IconTwitter from "../../icons/Twitter";
import IconGithub from "../../icons/Github";

const Resources = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <NavigationScrollView
      contentContainerStyle={[styles.root, { backgroundColor: colors.white }]}
    >
      <BottomModalChoice
        event="GettingStarted"
        title={t("help.gettingStarted.title")}
        description={t("help.gettingStarted.desc")}
        onPress={() =>
          Linking.openURL(
            "https://www.ledger.com/academy/?utm_source=ledger_live&utm_medium=self_referral&utm_content=help_mobile",
          )
        }
        Icon={IconDevice2}
      />
      <BottomModalChoice
        event="HelpHelpCenter"
        title={t("help.helpCenter.title")}
        description={t("help.helpCenter.desc")}
        onPress={() =>
          Linking.openURL(
            "https://www.ledger.com/start?utm_source=ledger_live&utm_medium=self_referral&utm_content=help_mobile",
          )
        }
        Icon={IconHelp}
      />
      <BottomModalChoice
        event="HelpLedgerAcademy"
        title={t("help.ledgerAcademy.title")}
        description={t("help.ledgerAcademy.desc")}
        onPress={() =>
          Linking.openURL(
            "https://support.ledger.com/hc/en-us?utm_source=ledger_live&utm_medium=self_referral&utm_content=help_mobile",
          )
        }
        Icon={IconAcademy}
      />
      <BottomModalChoice
        event="HelpFacebook"
        title={t("help.facebook.title")}
        description={t("help.facebook.desc")}
        onPress={() => Linking.openURL("https://facebook.com/Ledger")}
        Icon={IconFacebook}
      />
      <BottomModalChoice
        event="HelpTwitter"
        title={t("help.twitter.title")}
        description={t("help.twitter.desc")}
        onPress={() => Linking.openURL("https://twitter.com/Ledger")}
        Icon={IconTwitter}
      />
      <BottomModalChoice
        event="HelpGithub"
        title={t("help.github.title")}
        description={t("help.github.desc")}
        onPress={() => Linking.openURL("https://github.com/LedgerHQ")}
        Icon={IconGithub}
      />
      <BottomModalChoice
        event="HelpLedgerStatus"
        title={t("help.status.title")}
        description={t("help.status.desc")}
        onPress={() => Linking.openURL("https://status.ledger.com")}
        Icon={({ size, color }) => (
          <Icon name="activity" color={color} size={size} />
        )}
      />
    </NavigationScrollView>
  );
};

const styles = StyleSheet.create({
  root: { paddingTop: 16 },
});

export default Resources;
