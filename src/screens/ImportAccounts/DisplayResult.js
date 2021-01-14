// @flow
import React, { Component } from "react";
import { View, StyleSheet, SectionList } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useNavigation, useTheme } from "@react-navigation/native";
import { HeaderBackButton } from "@react-navigation/stack";
import groupBy from "lodash/groupBy";
import concat from "lodash/concat";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { Result } from "@ledgerhq/live-common/lib/cross";
import type { ImportItem } from "@ledgerhq/live-common/lib/account";
import { importAccountsMakeItems } from "@ledgerhq/live-common/lib/account";
import { Trans } from "react-i18next";

import { compose } from "redux";
import { importDesktopSettings } from "../../actions/settings";
import { importAccounts } from "../../actions/accounts";
import { accountsSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import { NavigatorName, ScreenName } from "../../const";
import LText from "../../components/LText";
import Button from "../../components/Button";
import StyledStatusBar from "../../components/StyledStatusBar";
import DisplayResultItem from "./DisplayResultItem";
import DisplayResultSettingsSection from "./DisplayResultSettingsSection";
import ResultSection from "./ResultSection";
import HeaderBackImage from "../../components/HeaderBackImage";
import { withTheme } from "../../colors";

const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
  route: { params: RouteParams },
  accounts: Account[],
  importAccounts: ({ items: ImportItem[], selectedAccounts: string[] }) => void,
  importDesktopSettings: (settings: any) => void,
  colors: *,
};

type RouteParams = {
  result: Result,
  onFinish?: () => void,
};

type State = {
  selectedAccounts: string[],
  items: ImportItem[],
  importing: boolean,
  importSettings: boolean,
};

export function BackButton() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  return (
    <HeaderBackButton
      tintColor={colors.grey}
      onPress={() => {
        if (navigation.replace) navigation.replace(ScreenName.ScanAccounts);
      }}
    >
      <HeaderBackImage />
    </HeaderBackButton>
  );
}

class DisplayResult extends Component<Props, State> {
  state = {
    selectedAccounts: [],
    items: [],
    importSettings: true,
    importing: false,
  };

  unmounted = false;

  componentWillUnmount() {
    this.unmounted = true;
  }

  onRetry = () => {
    const { navigation } = this.props;
    if (navigation.replace) navigation.replace(ScreenName.ScanAccounts);
  };

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    const items = importAccountsMakeItems({
      result: nextProps.route.params?.result,
      accounts: nextProps.accounts,
      items: prevState.items,
    });
    let selectedAccounts = prevState.selectedAccounts;
    if (prevState.items.length === 0) {
      // select all by default
      selectedAccounts = items.reduce(
        (acc, cur) =>
          cur.mode !== "id" && cur.mode !== "unsupported"
            ? concat(acc, cur.account.id)
            : acc,
        [],
      );
    }
    return { items, selectedAccounts };
  }

  onImport = async () => {
    const { importAccounts, importDesktopSettings, navigation } = this.props;
    const { selectedAccounts, items, importSettings } = this.state;
    const onFinish = this.props.route.params?.onFinish;
    this.setState({ importing: true });
    importAccounts({ items, selectedAccounts });
    if (importSettings) {
      importDesktopSettings(this.props.route.params?.result.settings);
    }

    if (onFinish) onFinish();
    else navigation.navigate(NavigatorName.Accounts);
  };

  onSwitchResultItem = (checked: boolean, account: Account) => {
    if (checked) {
      this.setState(({ selectedAccounts }) => ({
        selectedAccounts: selectedAccounts.concat(account.id),
      }));
    } else {
      this.setState(({ selectedAccounts }) => ({
        selectedAccounts: selectedAccounts.filter(s => s !== account.id),
      }));
    }
  };

  renderItem = ({ item: { account, mode } }) => (
    <DisplayResultItem
      key={account.id}
      account={account}
      mode={mode}
      checked={this.state.selectedAccounts.some(s => s === account.id)}
      onSwitch={this.onSwitchResultItem}
      importing={this.state.importing}
    />
  );

  renderSectionHeader = ({ section: { mode } }) => (
    <ResultSection mode={mode} />
  );

  onSwitchSettings = importSettings => this.setState({ importSettings });

  ListFooterComponent = () => (
    <DisplayResultSettingsSection
      onSwitch={this.onSwitchSettings}
      checked={this.state.importSettings}
    />
  );

  ListEmptyComponent = () => (
    <View>
      <ResultSection mode="empty" />
      <LText style={styles.emptyNotice}>
        <Trans i18nKey="account.import.result.descEmpty">
          <LText semiBold>No accounts</LText>
          {
            "found on your desktop app, please try again or continue the onboarding."
          }
        </Trans>
      </LText>
    </View>
  );

  keyExtractor = item => item.account.id;

  render() {
    const { colors } = this.props;
    const { items } = this.state;
    const itemsGroupedByMode = groupBy(items, "mode");

    return (
      <SafeAreaView
        forceInset={forceInset}
        style={[styles.root, { backgroundColor: colors.white }]}
      >
        <TrackScreen category="ImportAccounts" name="DisplayResult" />
        <StyledStatusBar />
        <>
          <SectionList
            style={styles.body}
            contentContainerStyle={styles.list}
            renderItem={this.renderItem}
            renderSectionHeader={this.renderSectionHeader}
            ListFooterComponent={this.ListFooterComponent}
            ListEmptyComponent={this.ListEmptyComponent}
            keyExtractor={this.keyExtractor}
            sections={Object.keys(itemsGroupedByMode).map(mode => ({
              mode,
              data: itemsGroupedByMode[mode],
            }))}
          />
          <View style={styles.footer}>
            <Button
              event="ImportAccountsRetry"
              containerStyle={[styles.button, styles.retry]}
              type="secondary"
              title={<Trans i18nKey="common.retry" />}
              onPress={this.onRetry}
            />
            <Button
              event="ImportAccountsContinue"
              containerStyle={styles.button}
              type="primary"
              title={<Trans i18nKey="common.import" />}
              onPress={this.onImport}
            />
          </View>
        </>
      </SafeAreaView>
    );
  }
}

// $FlowFixMe
export default compose(
  withTheme,
  connect(createStructuredSelector({ accounts: accountsSelector }), {
    importAccounts,
    importDesktopSettings,
  }),
)(DisplayResult);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexGrow: 1,
    flexDirection: "column",
    alignSelf: "stretch",
    justifyContent: "space-between",
  },
  body: {
    paddingHorizontal: 12,
    flex: 1,
  },
  footer: {
    padding: 20,
    flexDirection: "row",
  },
  button: {
    flex: 1,
  },
  retry: {
    marginRight: 8,
  },
  list: {
    paddingBottom: 40,
  },
  emptyNotice: {
    marginLeft: 8,
  },
});
