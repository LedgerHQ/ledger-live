/* @flow */
import React, { Component } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { translate } from "react-i18next";
import type { NavigationScreenProp } from "react-navigation";
import { getFullListSortedCryptoCurrencies } from "../../countervalues";
import type { DeviceInfo, ApplicationVersion } from "../../types/manager";
import ManagerAPI from "../../api/Manager";
import AppRow from "./AppRow";
import AppAction from "./AppAction";

const Header = () => (
  <View
    style={{
      height: 42,
      borderWidth: 1,
      borderColor: "#d8d8d8",
      backgroundColor: "white",
      borderRadius: 4,
      marginBottom: 20,
    }}
  />
);

const Pending = () => (
  // what do we display here? ping design
  <View style={{ backgroundColor: "grey", height: 100 }} />
);

const ErrorRender = (
  { error }: *, // eslint-disable-line
) => (
  // what do we display here? ping design
  <View style={{ backgroundColor: "red", height: 100 }} />
);

const actionKey = action => `${action.app.id}_${action.type}`;

class ManagerAppsList extends Component<
  {
    navigation: NavigationScreenProp<{
      params: {
        deviceId: string,
        meta: {
          deviceInfo: DeviceInfo,
        },
      },
    }>,
  },
  {
    apps: ApplicationVersion[],
    pending: boolean,
    error: ?Error,
    action: ?{ type: "install" | "uninstall", app: ApplicationVersion },
  },
> {
  static navigationOptions = {
    title: "App catalog",
  };

  state = {
    apps: [],
    pending: true,
    error: null,
    action: null,
  };

  unmount = false;

  componentDidMount() {
    this.fetchAppList();
  }

  componentWillUnmount() {
    this.unmount = true;
  }

  prepareAppList = ({
    applicationsList,
    compatibleAppVersionsList,
    sortedCryptoCurrencies,
  }: *): ApplicationVersion[] => {
    const isDevMode = false; // TODO from redux
    const filtered = isDevMode
      ? compatibleAppVersionsList.slice(0)
      : compatibleAppVersionsList.filter(version => {
          const app = applicationsList.find(e => e.id === version.app);
          if (app) {
            return app.category !== 2;
          }
          return false;
        });
    const sortedCryptoApps = [];
    // sort by crypto first
    sortedCryptoCurrencies.forEach(crypto => {
      const app = filtered.find(
        item => item.name.toLowerCase() === crypto.managerAppName.toLowerCase(),
      );
      if (app) {
        filtered.splice(filtered.indexOf(app), 1);
        sortedCryptoApps.push(app);
      }
    });
    return sortedCryptoApps.concat(filtered);
  };

  async fetchAppList() {
    this.setState(old => {
      if (old.pending) return null;
      return { pending: true, error: null };
    });
    try {
      const { navigation } = this.props;
      const { deviceInfo } = navigation.getParam("meta");

      // TODO we need to prefetch this before. we can already do it during the manager loading because we have the deviceInfo before the genuine check.

      const deviceVersionP = ManagerAPI.getDeviceVersion(
        deviceInfo.targetId,
        deviceInfo.providerId,
      );

      const firmwareDataP = deviceVersionP.then(deviceVersion =>
        ManagerAPI.getCurrentFirmware({
          deviceId: deviceVersion.id,
          fullVersion: deviceInfo.fullVersion,
          provider: deviceInfo.providerId,
        }),
      );

      const applicationsByDeviceP = Promise.all([
        deviceVersionP,
        firmwareDataP,
      ]).then(([deviceVersion, firmwareData]) =>
        ManagerAPI.applicationsByDevice({
          provider: deviceInfo.providerId,
          current_se_firmware_final_version: firmwareData.id,
          device_version: deviceVersion.id,
        }),
      );

      const [
        applicationsList,
        compatibleAppVersionsList,
        sortedCryptoCurrencies,
      ] = await Promise.all([
        ManagerAPI.listApps(),
        applicationsByDeviceP,
        getFullListSortedCryptoCurrencies(),
      ]);

      const filteredAppVersionsList = this.prepareAppList({
        applicationsList,
        compatibleAppVersionsList,
        sortedCryptoCurrencies,
      });

      if (this.unmount) return;
      this.setState({
        error: null,
        pending: false,
        apps: filteredAppVersionsList,
      });
    } catch (error) {
      if (this.unmount) return;
      this.setState({
        pending: false,
        error,
      });
    }
  }

  onActionClose = () => {
    this.setState({ action: null });
  };

  onInstall = (app: ApplicationVersion) => {
    this.setState({
      action: { type: "install", app },
    });
  };

  onUninstall = (app: ApplicationVersion) => {
    this.setState({
      action: { type: "uninstall", app },
    });
  };

  renderRow = ({ item }: { item: ApplicationVersion }) => (
    <AppRow
      app={item}
      onInstall={this.onInstall}
      onUninstall={this.onUninstall}
    />
  );

  keyExtractor = (d: ApplicationVersion) => String(d.id);

  render() {
    const { navigation } = this.props;
    const { apps, pending, error, action } = this.state;
    const { deviceInfo } = navigation.getParam("meta");
    const deviceId = navigation.getParam("deviceId");
    return (
      <View style={styles.root}>
        <Header />
        {pending ? (
          <Pending />
        ) : error ? (
          <ErrorRender error={error} />
        ) : (
          <FlatList
            data={apps}
            renderItem={this.renderRow}
            keyExtractor={this.keyExtractor}
          />
        )}
        {action ? (
          <AppAction
            key={actionKey(action)}
            action={action}
            onClose={this.onActionClose}
            deviceId={deviceId}
            targetId={deviceInfo.targetId}
          />
        ) : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 20,
  },
});

export default translate()(ManagerAppsList);
