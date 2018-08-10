/* @flow */
import React, { Component } from "react";
import { ScrollView, View } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import { translate } from "react-i18next";

import type { T } from "../../types/common";

import SettingsCard from "../../components/SettingsCard";
import Assets from "../../images/icons/Assets";
import LiveLogo from "../../images/icons/LiveLogo";
import Help from "../../images/icons/Help";
import Display from "../../images/icons/Display";
import colors from "../../colors";

class Settings extends Component<{
  navigation: NavigationScreenProp<*>,
  t: T,
}> {
  static navigationOptions = {
    title: "Settings",
  };

  render() {
    const { navigation, t } = this.props;

    const settingsCards = [
      {
        key: "general",
        icon: <Display size={16} color={colors.live} />,
        title: t("common:settings.display.title"),
        desc: t("common:settings.display.desc"),
        onClick: () => {
          navigation.navigate("GeneralSettings", {});
        },
      },
      {
        key: "currencies",
        icon: <Assets size={16} color={colors.live} />,
        title: t("common:settings.currencies.title"),
        desc: t("common:settings.currencies.desc"),
        onClick: () => {
          navigation.navigate("CurrenciesSettings", {});
        },
      },
      {
        key: "about",
        icon: <LiveLogo size={16} color={colors.live} />,
        title: t("common:settings.about.title"),
        desc: t("common:settings.about.desc"),
        onClick: () => {
          navigation.navigate("AboutSettings", {});
        },
      },
      {
        key: "help",
        icon: <Help size={16} color={colors.live} />,
        title: t("common:settings.help.title"),
        desc: t("common:settings.help.desc"),
        onClick: () => {
          navigation.navigate("HelpSettings", {});
        },
      },
    ];

    return (
      <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
        <View>
          {settingsCards.map(card => (
            <SettingsCard key={card.key} card={card} />
          ))}
        </View>
      </ScrollView>
    );
  }
}

export default translate()(Settings);
