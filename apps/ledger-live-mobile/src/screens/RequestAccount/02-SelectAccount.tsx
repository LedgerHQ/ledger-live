import React, { useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ListRenderItem,
} from "react-native";
import { Trans } from "react-i18next";
import type { Account, AccountLike, SubAccount } from "@ledgerhq/types-live";
import { useSelector } from "react-redux";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import {
  CryptoCurrency,
  CryptoOrTokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import { accountsByCryptoCurrencyScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import LText from "../../components/LText";
import FilteredSearchBar from "../../components/FilteredSearchBar";
import AccountCard from "../../components/AccountCard";
import KeyboardView from "../../components/KeyboardView";
import { formatSearchResultsTuples } from "../../helpers/formatAccountSearchResults";
import type { SearchResult } from "../../helpers/formatAccountSearchResults";
import { NavigatorName, ScreenName } from "../../const";
import Button from "../../components/Button";
import type {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { RequestAccountNavigatorParamList } from "../../components/RootNavigator/types/RequestAccountNavigator";
import { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";

const SEARCH_KEYS = [
  "account.name",
  "account.unit.code",
  "account.token.name",
  "account.token.ticker",
  "subAccount.name",
  "subAccount.unit.code",
  "subAccount.token.name",
  "subAccount.token.ticker",
];

type Navigation = CompositeScreenProps<
  StackNavigatorProps<
    RequestAccountNavigatorParamList,
    ScreenName.RequestAccountsSelectAccount
  >,
  StackNavigatorProps<BaseNavigatorStackParamList, NavigatorName.AddAccounts>
>;

type Props = Navigation;

const keyExtractor = (item: SearchResult) => item.account.id;

const Item = ({
  item: result,
  onSelect,
}: {
  item: SearchResult;
  onSelect: (account: AccountLike, parentAccount?: Account) => void;
}) => {
  const { account, parentAccount, match } = result;
  const onPress = useCallback(
    () => onSelect(account, parentAccount),
    [account, onSelect, parentAccount],
  );
  return (
    <View>
      <AccountCard
        disabled={!match}
        account={account}
        style={styles.card}
        onPress={onPress}
      />
    </View>
  );
};

const List = ({
  items,
  renderItem,
  renderFooter,
}: {
  items: { account: AccountLike; subAccount: SubAccount }[];
  renderItem: ListRenderItem<SearchResult>;
  renderFooter: React.ComponentType | React.ReactElement | null | undefined;
}) => {
  const formatedList = useMemo(() => formatSearchResultsTuples(items), [items]);
  return (
    <>
      <FlatList
        data={formatedList}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        ListFooterComponent={renderFooter}
      />
    </>
  );
};

function SelectAccount({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { currency, allowAddAccount, onSuccess, onError } = route.params;
  const accounts = useSelector(
    accountsByCryptoCurrencyScreenSelector(currency as CryptoCurrency),
  ) as { account: AccountLike; subAccount: SubAccount | null }[];
  const onSelect = useCallback(
    (account: AccountLike, parentAccount?: Account) => {
      onSuccess && onSuccess(account, parentAccount);
      const n =
        navigation.getParent<
          StackNavigatorNavigation<BaseNavigatorStackParamList>
        >() || navigation;
      n.pop();
    },
    [navigation, onSuccess],
  );
  const renderItem = useCallback(
    ({ item }) => <Item item={item} onSelect={onSelect} />,
    [onSelect],
  );
  const onAddAccount = useCallback(() => {
    navigation.navigate(NavigatorName.RequestAccountsAddAccounts, {
      screen: ScreenName.AddAccountsSelectDevice,
      params: {
        currency: currency as CryptoOrTokenCurrency,
        onSuccess: () =>
          navigation.navigate(NavigatorName.RequestAccount, {
            screen: ScreenName.RequestAccountsSelectAccount,
            params: route.params,
          }),
        onError,
      },
    });
  }, [currency, navigation, onError, route.params]);
  const renderFooter = useCallback(
    () =>
      allowAddAccount ? (
        <View style={styles.buttonContainer}>
          <Button
            containerStyle={styles.button}
            event="ExchangeStartBuyFlow"
            type="primary"
            title={
              <Trans
                i18nKey="requestAccount.selectAccount.addAccount"
                values={{
                  currency: currency.name,
                }}
              />
            }
            onPress={onAddAccount}
          />
        </View>
      ) : null,
    [allowAddAccount, currency.name, onAddAccount],
  );
  const renderList = useCallback(
    items => (
      <List items={items} renderItem={renderItem} renderFooter={renderFooter} />
    ),
    [renderFooter, renderItem],
  );
  const renderEmptySearch = useCallback(
    () => (
      <View style={styles.emptyResults}>
        <LText style={styles.emptyText} color="fog">
          <Trans i18nKey="transfer.receive.noAccount" />
        </LText>
      </View>
    ),
    [],
  );
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="RequestAccount" name="SelectAccount" />
      <KeyboardView>
        <View style={styles.searchContainer}>
          {accounts.length > 0 ? (
            <FilteredSearchBar
              keys={SEARCH_KEYS}
              inputWrapperStyle={styles.card}
              list={accounts}
              renderList={renderList}
              renderEmptySearch={renderEmptySearch}
            />
          ) : (
            renderFooter()
          )}
        </View>
      </KeyboardView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  addAccountButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 16,
    alignItems: "center",
  },
  root: {
    flex: 1,
  },
  tokenCardStyle: {
    marginLeft: 26,
    paddingLeft: 7,
    borderLeftWidth: 1,
  },
  card: {
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  searchContainer: {
    paddingTop: 18,
    flex: 1,
  },
  list: {
    paddingTop: 8,
  },
  emptyResults: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
  },
  button: {
    flex: 1,
  },
  buttonContainer: {
    paddingTop: 24,
    paddingLeft: 16,
    paddingRight: 16,
    flexDirection: "row",
  },
});
export default SelectAccount;
