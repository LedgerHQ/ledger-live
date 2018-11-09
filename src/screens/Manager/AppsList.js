/* @flow */
import React, { Component } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { translate, Trans } from "react-i18next";
import type { NavigationScreenProp } from "react-navigation";
import { getFullListSortedCryptoCurrencies } from "../../countervalues";
import type { DeviceInfo, ApplicationVersion } from "../../types/manager";
import ManagerAPI from "../../api/Manager";
import KeyboardView from "../../components/KeyboardView";
import FilteredSearchBar from "../../components/FilteredSearchBar";
import LText from "../../components/LText";
import Spinning from "../../components/Spinning";
import LiveLogo from "../../icons/LiveLogoIcon";
import colors from "../../colors";

import AppRow from "./AppRow";
import AppAction from "./AppAction";

const Pending = () => (
  <View style={styles.pending}>
    <Spinning>
      <LiveLogo color={colors.grey} size={32} />
    </Spinning>

    <LText style={styles.pendingText}>
      <Trans i18nKey="manager.appList.loading" />
    </LText>
  </View>
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

  renderList = items => (
    <FlatList
      data={items}
      renderItem={this.renderRow}
      keyExtractor={this.keyExtractor}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
      contentContainerStyle={styles.listContainer}
    />
  );

  renderEmptySearch = () => (
    <View>
      <LText>No apps found</LText>
    </View>
  );

  keyExtractor = (d: ApplicationVersion) => String(d.id);

  render() {
    const { navigation } = this.props;
    const { apps, pending, error, action } = this.state;
    const { deviceInfo } = navigation.getParam("meta");
    const deviceId = navigation.getParam("deviceId");
    return (
      <View style={styles.root}>
        <KeyboardView style={{ flex: 1 }}>
          {pending ? (
            <Pending />
          ) : error ? (
            <ErrorRender error={error} />
          ) : (
            <FilteredSearchBar
              list={apps}
              renderList={this.renderList}
              renderEmptySearch={this.renderEmptySearch}
              inputWrapperStyle={styles.inputWrapper}
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
        </KeyboardView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
  },
  inputWrapper: {
    marginTop: 8,
  },
  listContainer: {
    paddingTop: 16,
    marginBottom: 16,
  },
  pending: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  pendingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.grey,
  },
});

export default translate()(ManagerAppsList);
