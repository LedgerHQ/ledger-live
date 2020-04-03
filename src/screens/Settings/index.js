/* @flow */
import React, { Component } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import { translate } from "react-i18next";
import { View, StyleSheet, TouchableWithoutFeedback } from "react-native";
// $FlowFixMe
import { ScrollView } from "react-navigation";
import Icon from "react-native-vector-icons/dist/Feather";
import Config from "react-native-config";
import type { NavigationScreenProp } from "react-navigation";
import type { Account, CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import { createStructuredSelector } from "reselect";
import i18next from "i18next";
import {
  accountsSelector,
  cryptoCurrenciesSelector,
} from "../../reducers/accounts";
import type { T } from "../../types/common";
import SettingsCard from "../../components/SettingsCard";
import PoweredByLedger from "./PoweredByLedger";
import Assets from "../../icons/Assets";
import Accounts from "../../icons/Accounts";
import LiveLogoIcon from "../../icons/LiveLogoIcon";
import Atom from "../../icons/Atom";
import Help from "../../icons/Help";
import Display from "../../icons/Display";
import colors from "../../colors";
import TrackScreen from "../../analytics/TrackScreen";
import timer from "../../timer";

type Props = {
  navigation: NavigationScreenProp<*>,
  currencies: CryptoCurrency[],
  accounts: Account[],
  t: T,
};

const mapStateToProps = createStructuredSelector({
  currencies: cryptoCurrenciesSelector,
  accounts: accountsSelector,
});

class Settings extends Component<Props, *> {
  static navigationOptions = {
    title: i18next.t("settings.header"),
  };

  state = {
    debugVisible: Config.FORCE_DEBUG_VISIBLE || false,
  };

  count = 0;

  debugTimeout: *;

  onDebugHiddenPress = () => {
    if (this.debugTimeout) this.debugTimeout();
    if (this.count++ > 6) {
      this.count = 0;
      this.setState(({ debugVisible }) => ({
        debugVisible: !debugVisible,
      }));
    } else {
      this.debugTimeout = timer.timeout(() => {
        this.count = 0;
      }, 1000);
    }
  };

  render() {
    const { t, currencies, accounts } = this.props;
    const { debugVisible } = this.state;
    return (
      <ScrollView>
        <TrackScreen category="Settings" />
        <View style={styles.root}>
          <SettingsCard
            title={t("settings.display.title")}
            desc={t("settings.display.desc")}
            icon={<Display size={16} color={colors.live} />}
            onClick={() => this.props.navigation.navigate("GeneralSettings")}
          />
          {currencies.length > 0 && (
            <SettingsCard
              title={t("settings.cryptoAssets.title")}
              desc={t("settings.cryptoAssets.desc")}
              icon={<Assets size={16} color={colors.live} />}
              onClick={() =>
                this.props.navigation.navigate("CryptoAssetsSettings")
              }
            />
          )}
          {accounts.length > 0 && (
            <SettingsCard
              title={t("settings.accounts.title")}
              desc={t("settings.accounts.desc")}
              icon={<Accounts size={16} color={colors.live} />}
              onClick={() => this.props.navigation.navigate("AccountsSettings")}
            />
          )}
          <SettingsCard
            title={t("settings.about.title")}
            desc={t("settings.about.desc")}
            icon={<LiveLogoIcon size={16} color={colors.live} />}
            onClick={() => this.props.navigation.navigate("AboutSettings")}
          />
          <SettingsCard
            title={t("settings.help.title")}
            desc={t("settings.help.desc")}
            icon={<Help size={16} color={colors.live} />}
            onClick={() => this.props.navigation.navigate("HelpSettings")}
          />
          <SettingsCard
            title={t("settings.experimental.title")}
            desc={t("settings.experimental.desc")}
            icon={<Atom size={16} color={colors.live} />}
            onClick={() =>
              this.props.navigation.navigate("ExperimentalSettings")
            }
          />
          {debugVisible ? (
            <SettingsCard
              title="Debug"
              desc="Use at your own risk – Developer tools"
              icon={<Icon name="wind" size={16} color={colors.live} />}
              onClick={() => this.props.navigation.navigate("DebugSettings")}
            />
          ) : null}
          <TouchableWithoutFeedback onPress={this.onDebugHiddenPress}>
            <View>
              <PoweredByLedger />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </ScrollView>
    );
  }
}

export default compose(
  connect(mapStateToProps),
  translate(),
)(Settings);

const styles = StyleSheet.create({
  root: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 64,
  },
});
