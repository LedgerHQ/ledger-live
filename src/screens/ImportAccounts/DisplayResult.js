// @flow
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { SectionList, SafeAreaView } from "react-navigation";
import { HeaderBackButton } from "react-navigation-stack";
import groupBy from "lodash/groupBy";
import concat from "lodash/concat";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { NavigationStackProp } from "react-navigation-stack";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { Result } from "@ledgerhq/live-common/lib/cross";
import type { ImportItem } from "@ledgerhq/live-common/lib/account";
import { importAccountsMakeItems } from "@ledgerhq/live-common/lib/account";
import { translate, Trans } from "react-i18next";
import i18next from "i18next";

import { importDesktopSettings } from "../../actions/settings";
import { importAccounts } from "../../actions/accounts";
import { accountsSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import LText from "../../components/LText";
import colors from "../../colors";
import Button from "../../components/Button";
import StyledStatusBar from "../../components/StyledStatusBar";
import DisplayResultItem from "./DisplayResultItem";
import DisplayResultSettingsSection from "./DisplayResultSettingsSection";
import ResultSection from "./ResultSection";
import HeaderBackImage from "../../components/HeaderBackImage";

const forceInset = { bottom: "always" };

type Nav = NavigationStackProp<{
  params: {
    result: Result,
    onFinish?: (NavigationStackProp<*>) => void,
  },
}>;

type Props = {
  navigation: Nav,
  accounts: Account[],
  importAccounts: ({ items: ImportItem[], selectedAccounts: string[] }) => void,
  importDesktopSettings: (*) => void,
};

type State = {
  selectedAccounts: string[],
  items: ImportItem[],
  importing: boolean,
  importSettings: boolean,
};

const BackButton = ({ navigation }: { navigation: Nav }) => (
  // $FlowFixMe
  <HeaderBackButton
    tintColor={colors.grey}
    onPress={() => {
      if (navigation.replace) navigation.replace("ScanAccounts");
    }}
  >
    <HeaderBackImage />
  </HeaderBackButton>
);

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

  static navigationOptions = ({ navigation }) => ({
    title: i18next.t("account.import.result.title"),
    headerLeft: <BackButton navigation={navigation} />,
  });

  onRetry = () => {
    const { navigation } = this.props;
    if (navigation.replace) navigation.replace("ScanAccounts");
  };

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    const items = importAccountsMakeItems({
      result: nextProps.navigation.getParam("result"),
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

  close = () => {
    const { navigation } = this.props;
    navigation.dismiss();
  };

  onImport = async () => {
    const { importAccounts, importDesktopSettings, navigation } = this.props;
    const { selectedAccounts, items, importSettings } = this.state;
    const onFinish = navigation.getParam("onFinish");
    this.setState({ importing: true });
    importAccounts({ items, selectedAccounts });
    if (importSettings) {
      importDesktopSettings(navigation.getParam("result").settings);
    }

    if (onFinish) onFinish(navigation);
    else navigation.navigate("Accounts");
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
    const { items } = this.state;
    const itemsGroupedByMode = groupBy(items, "mode");

    return (
      <SafeAreaView forceInset={forceInset} style={styles.root}>
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

export default translate()(
  connect(
    createStructuredSelector({ accounts: accountsSelector }),
    {
      importAccounts,
      importDesktopSettings,
    },
  )(DisplayResult),
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexGrow: 1,
    flexDirection: "column",
    alignSelf: "stretch",
    justifyContent: "space-between",
    backgroundColor: colors.white,
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
  sectionHeaderText: {
    backgroundColor: colors.white,
    color: colors.grey,
    fontSize: 14,
    paddingTop: 10,
    paddingBottom: 10,
  },
  emptyNotice: {
    marginLeft: 8,
  },
  noAccountText: {
    flex: 1,
    fontSize: 16,
  },
});
