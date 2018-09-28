/* @flow */
import React, { Component } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import config from "react-native-config";
import { translate } from "react-i18next";
import { ScrollView, View, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import { createStructuredSelector } from "reselect";
import { currenciesSelector } from "../../reducers/accounts";
import type { T } from "../../types/common";
import SettingsCard from "../../components/SettingsCard";
import Assets from "../../icons/Assets";
import LiveLogoIcon from "../../icons/LiveLogoIcon";
import Help from "../../icons/Help";
import Display from "../../icons/Display";
import colors from "../../colors";
import GenerateMockAccountsButton from "../../components/GenerateMockAccountsButton";
import ImportBridgeStreamData from "../../components/ImportBridgeStreamData";
import OpenDebugBLE from "../../components/OpenDebugBLE";

type Props = {
  navigation: NavigationScreenProp<*>,
  currencies: CryptoCurrency[],
  t: T,
};

const mapStateToProps = createStructuredSelector({
  currencies: currenciesSelector,
});
class Settings extends Component<Props> {
  static navigationOptions = {
    title: "Settings",
  };

  navigateTo = (screenName: string) => {
    const { navigation, currencies } = this.props;
    if (screenName === "CurrencySettings") {
      return currencies.length < 2
        ? navigation.navigate("CurrencySettings", {
            currencyId: currencies[0].id,
          })
        : navigation.navigate("CurrenciesList");
    }
    return navigation.navigate(screenName);
  };

  render() {
    const { t, currencies } = this.props;

    return (
      <ScrollView>
        <View style={styles.root}>
          <SettingsCard
            title={t("common:settings.display.title")}
            desc={t("common:settings.display.desc")}
            icon={<Display size={16} color={colors.live} />}
            onClick={() => this.navigateTo("GeneralSettings")}
          />
          {currencies.length > 0 && (
            <SettingsCard
              title={t("common:settings.currencies.title")}
              desc={t("common:settings.currencies.desc")}
              icon={<Assets size={16} color={colors.live} />}
              onClick={() => this.navigateTo("CurrencySettings")}
            />
          )}
          <SettingsCard
            title={t("common:settings.about.title")}
            desc={t("common:settings.about.desc")}
            icon={<LiveLogoIcon size={16} color={colors.live} />}
            onClick={() => this.navigateTo("AboutSettings")}
          />
          <SettingsCard
            title={t("common:settings.help.title")}
            desc={t("common:settings.help.desc")}
            icon={<Help size={16} color={colors.live} />}
            onClick={() => this.navigateTo("HelpSettings")}
          />
          {config.DEBUG_MOCK_ACCOUNT && !isNaN(config.DEBUG_MOCK_ACCOUNT) ? (
            <GenerateMockAccountsButton
              containerStyle={{ marginTop: 20 }}
              title={`Generate ${config.DEBUG_MOCK_ACCOUNT} Mock Accounts`}
              count={parseInt(config.DEBUG_MOCK_ACCOUNT, 10)}
            />
          ) : null}
          {config.BRIDGESTREAM_DATA ? (
            // $FlowFixMe
            <ImportBridgeStreamData
              containerStyle={{ marginTop: 20 }}
              title="Import hardcoded BRIDGESTREAM_DATA"
              dataStr={config.BRIDGESTREAM_DATA}
            />
          ) : null}
          {config.DEBUG_BLE ? <OpenDebugBLE /> : null}
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
