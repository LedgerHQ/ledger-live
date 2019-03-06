/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
// $FlowFixMe
import { FlatList } from "react-navigation";
import { translate } from "react-i18next";
import i18next from "i18next";
import type { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type {
  DeviceInfo,
  ApplicationVersion,
} from "@ledgerhq/live-common/lib/types/manager";
import manager from "@ledgerhq/live-common/lib/manager";
import logger from "../../logger";
import FilteredSearchBar from "../../components/FilteredSearchBar";
import LText from "../../components/LText";
import { TrackScreen } from "../../analytics";

import AppsListPending from "./AppsListPending";
import AppsListError from "./AppsListError";
import AppRow from "./AppRow";
import AppAction from "./AppAction";
import { developerModeEnabledSelector } from "../../reducers/settings";
import { getFullListSortedCryptoCurrencies } from "../../countervalues";

const actionKey = action => `${action.app.id}_${action.type}`;

type Props = {
  navigation: NavigationScreenProp<{
    params: {
      deviceId: string,
      meta: {
        deviceInfo: DeviceInfo,
      },
    },
  }>,
  developerModeEnabled: boolean,
};

const mapStateToProps = createStructuredSelector({
  developerModeEnabled: developerModeEnabledSelector,
});

class ManagerAppsList extends Component<
  Props,
  {
    apps: ApplicationVersion[],
    pending: boolean,
    error: ?Error,
    action: ?{ type: "install" | "uninstall", app: ApplicationVersion },
  },
> {
  static navigationOptions = {
    title: i18next.t("manager.appList.title"),
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

  componentDidUpdate({ developerModeEnabled }) {
    if (developerModeEnabled !== this.props.developerModeEnabled) {
      this.fetchAppList();
    }
  }

  componentWillUnmount() {
    this.fetchAppId++;
  }

  fetchAppId = 0;
  fetchAppList = async () => {
    const id = ++this.fetchAppId;
    this.setState(old => {
      if (old.pending) return null;
      return { pending: true, error: null };
    });
    try {
      const { navigation, developerModeEnabled } = this.props;
      const { deviceInfo } = navigation.getParam("meta");

      const apps = await manager.getAppsList(
        deviceInfo,
        developerModeEnabled,
        getFullListSortedCryptoCurrencies,
      );
      if (id !== this.fetchAppId) return;
      this.setState({
        error: null,
        pending: false,
        apps,
      });
    } catch (error) {
      logger.critical(error);
      if (id !== this.fetchAppId) return;
      this.setState({
        pending: false,
        error,
      });
    }
  };

  onActionClose = () => {
    this.setState({ action: null });
  };

  onActionOpenAccounts = () => {
    const { navigation } = this.props;
    this.setState({ action: null }, () => navigation.navigate("Accounts"));
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
    const { deviceId, deviceInfo, modelId } = navigation.getParam("meta");
    return (
      <View style={styles.root}>
        <TrackScreen category="Manager" name="AppsList" />
        {pending ? (
          <AppsListPending />
        ) : error ? (
          <AppsListError error={error} onRetry={this.fetchAppList} />
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
            onOpenAccounts={this.onActionOpenAccounts}
            deviceId={deviceId}
            modelId={modelId}
            targetId={deviceInfo.targetId}
            isOpened={!!action}
          />
        ) : null}
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
    paddingBottom: 16,
  },
});

export default translate()(connect(mapStateToProps)(ManagerAppsList));
