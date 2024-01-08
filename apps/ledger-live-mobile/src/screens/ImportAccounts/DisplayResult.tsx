import React, { Component } from "react";
import { View, StyleSheet, SectionList, SectionListData } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useTheme } from "@react-navigation/native";
import { HeaderBackButton } from "@react-navigation/elements";
import groupBy from "lodash/groupBy";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { Account } from "@ledgerhq/types-live";
import {
  ImportItem,
  importAccountsMakeItems,
  syncNewAccountsToImport,
  ImportAccountsReduceInput,
} from "@ledgerhq/live-common/account/index";
import { Trans } from "react-i18next";

import { compose } from "redux";
import { Flex } from "@ledgerhq/native-ui";
import { importDesktopSettings } from "~/actions/settings";
import { importAccounts } from "~/actions/accounts";
import { accountsSelector } from "~/reducers/accounts";
import { TrackScreen } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import LText from "~/components/LText";
import Button from "~/components/Button";
import StyledStatusBar from "~/components/StyledStatusBar";
import DisplayResultItem from "./DisplayResultItem";
import DisplayResultSettingsSection from "./DisplayResultSettingsSection";
import ResultSection from "./ResultSection";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import type { State as StoreState } from "~/reducers/types";
import type { ImportAccountsNavigatorParamList } from "~/components/RootNavigator/types/ImportAccountsNavigator";
import { bridgeCache } from "~/bridge/cache";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { SettingsImportDesktopPayload } from "~/actions/types";
import { NavigationHeaderBackImage } from "~/components/NavigationHeaderBackButton";

type NavigationProps = BaseComposite<
  StackNavigatorProps<ImportAccountsNavigatorParamList, ScreenName.DisplayResult>
>;

type ConnectProps = {
  backlistedTokenIds: string[];
  accounts: Account[];
  importAccounts: (_: ImportAccountsReduceInput) => void;
  importDesktopSettings: typeof importDesktopSettings;
};

type Props = ConnectProps & NavigationProps;

type State = {
  selectedAccounts: string[];
  items: ImportItem[];
  importing: boolean;
  importSettings: boolean;
};

type SectionData = SectionListData<ImportItem, { mode: ImportItem["mode"] }>;

export function BackButton() {
  const { colors } = useTheme();
  const navigation =
    useNavigation<
      StackNavigatorNavigation<ImportAccountsNavigatorParamList, ScreenName.DisplayResult>
    >();
  return (
    <HeaderBackButton
      tintColor={colors.grey}
      onPress={() => {
        if (navigation.replace) navigation.replace(ScreenName.ScanAccounts);
      }}
      backImage={NavigationHeaderBackImage}
    />
  );
}

class DisplayResult extends Component<Props, State> {
  state = {
    selectedAccounts: [],
    items: [] as ImportItem[],
    importSettings: true,
    importing: false,
  };

  unmounted = false;

  componentWillUnmount() {
    this.unmounted = true;
  }

  onRetry = () => {
    const { navigation } = this.props;
    if (navigation.replace) navigation.replace(ScreenName.ScanAccounts, {});
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
      selectedAccounts = items.reduce<string[]>((acc, cur) => {
        if (cur.mode !== "id" && cur.mode !== "unsupported") {
          const combined = acc.concat(cur.account.id);
          return combined;
        }

        return acc;
      }, []);
    }
    return { items, selectedAccounts };
  }

  onImport = async () => {
    const { importAccounts, importDesktopSettings, navigation, backlistedTokenIds } = this.props;
    const { selectedAccounts, items, importSettings, importing } = this.state;
    if (importing) return;
    const onFinish = this.props.route.params?.onFinish;
    this.setState({ importing: true });
    const syncResult = await syncNewAccountsToImport(
      {
        items,
        selectedAccounts,
      },
      bridgeCache,
      backlistedTokenIds,
    );
    importAccounts({ items, selectedAccounts, syncResult });
    if (importSettings) {
      importDesktopSettings(
        this.props.route.params?.result.settings as SettingsImportDesktopPayload,
      );
    }

    if (onFinish) onFinish();
    else
      navigation.navigate(NavigatorName.Main, {
        screen: NavigatorName.Portfolio,
      });
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

  renderItem = ({ item: { account, mode } }: { item: ImportItem }) => (
    <DisplayResultItem
      key={account.id}
      account={account}
      mode={mode}
      checked={this.state.selectedAccounts.some(s => s === account.id)}
      onSwitch={this.onSwitchResultItem}
      importing={this.state.importing}
    />
  );

  renderSectionHeader = ({ section: { mode } }: { section: SectionData }) => (
    <ResultSection mode={mode} />
  );

  onSwitchSettings = (importSettings: boolean) => this.setState({ importSettings });

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
          <LText semiBold>NO_ACCOUNTS</LText>
          {"found on your desktop app, please try again or continue the onboarding."}
        </Trans>
      </LText>
    </View>
  );

  keyExtractor = (item: ImportItem): string => item.account.id;

  render() {
    const { items, importing } = this.state;
    const itemsGroupedByMode = groupBy<ImportItem>(items, "mode");

    const sections = Object.keys(itemsGroupedByMode).map(mode => ({
      mode,
      data: itemsGroupedByMode[mode],
    })) as SectionData[];

    return (
      <SafeAreaView style={[styles.root]}>
        <Flex bg="background.main" flex={1}>
          <TrackScreen category="ImportAccounts" name="DisplayResult" />
          <StyledStatusBar />
          <SectionList
            style={styles.body}
            contentContainerStyle={styles.list}
            renderItem={this.renderItem}
            renderSectionHeader={this.renderSectionHeader}
            ListFooterComponent={this.ListFooterComponent}
            ListEmptyComponent={this.ListEmptyComponent}
            keyExtractor={this.keyExtractor}
            extraData={importing}
            sections={sections}
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
              disabled={importing}
            />
          </View>
        </Flex>
      </SafeAreaView>
    );
  }
}

export default compose(
  connect(
    createStructuredSelector<
      StoreState,
      {
        accounts: Account[];
        backlistedTokenIds: string[];
      }
    >({
      accounts: accountsSelector,
      backlistedTokenIds: blacklistedTokenIdsSelector,
    }),
    {
      importAccounts,
      importDesktopSettings,
    },
  ),
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
