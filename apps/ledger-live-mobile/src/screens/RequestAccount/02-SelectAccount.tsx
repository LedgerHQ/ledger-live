import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList, SafeAreaView, ListRenderItem } from "react-native";
import { Trans } from "react-i18next";
import type { Account, AccountLike, SubAccount } from "@ledgerhq/types-live";
import { useSelector } from "react-redux";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import { CryptoCurrency, CryptoOrTokenCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useGetAccountIds } from "@ledgerhq/live-common/wallet-api/react";
import { accountsByCryptoCurrencyScreenSelector } from "~/reducers/accounts";
import { TrackScreen } from "~/analytics";
import LText from "~/components/LText";
import FilteredSearchBar from "~/components/FilteredSearchBar";
import AccountCard from "~/components/AccountCard";
import KeyboardView from "~/components/KeyboardView";
import { formatSearchResultsTuples } from "~/helpers/formatAccountSearchResults";
import type { SearchResult } from "~/helpers/formatAccountSearchResults";
import { NavigatorName, ScreenName } from "~/const";
import Button from "~/components/Button";
import type {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { RequestAccountNavigatorParamList } from "~/components/RootNavigator/types/RequestAccountNavigator";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { Flex } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/deposit/index";
import { LoadingBasedGroupedCurrencies } from "@ledgerhq/live-common/deposit/type";
import { AddAccountContexts } from "LLM/features/Accounts/screens/AddAccount/enums";

const SEARCH_KEYS = [
  "name",
  "account.currency.name",
  "account.currency.ticker",
  "account.token.name",
  "account.token.ticker",
  "subAccount.name",
  "subAccount.token.name",
  "subAccount.token.ticker",
];

type Navigation = CompositeScreenProps<
  StackNavigatorProps<RequestAccountNavigatorParamList, ScreenName.RequestAccountsSelectAccount>,
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
        parentAccount={parentAccount}
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
  items: { account: AccountLike; subAccount?: SubAccount | null }[];
  renderItem: ListRenderItem<SearchResult>;
  renderFooter: React.ComponentType | React.ReactElement | null | undefined;
}) => {
  const formatedList = useMemo(() => formatSearchResultsTuples(items), [items]);
  return (
    <Flex>
      <FlatList
        data={formatedList}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        ListFooterComponent={renderFooter}
      />
    </Flex>
  );
};

function SelectAccount({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { accounts$, currency, allowAddAccount, onSuccess } = route.params;
  const accountIds = useGetAccountIds(accounts$);
  const accounts = useSelector(accountsByCryptoCurrencyScreenSelector(currency, accountIds));
  const llmNetworkBasedAddAccountFlow = useFeature("llmNetworkBasedAddAccountFlow");
  const onSelect = useCallback(
    (account: AccountLike, parentAccount?: Account) => {
      onSuccess && onSuccess(account, parentAccount);
      const n =
        navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>() || navigation;
      n.pop();
    },
    [navigation, onSuccess],
  );

  const renderItem: ListRenderItem<SearchResult> = useCallback(
    ({ item }) => <Item item={item} onSelect={onSelect} />,
    [onSelect],
  );

  const { result, loadingStatus: providersLoadingStatus } = useGroupedCurrenciesByProvider(
    true,
  ) as LoadingBasedGroupedCurrencies;

  const { currenciesByProvider } = result;

  const provider = useMemo(
    () =>
      currenciesByProvider.find(elem =>
        elem.currenciesByNetwork.some(
          currencyByNetwork =>
            (currencyByNetwork as CryptoCurrency | TokenCurrency).id === currency.id,
        ),
      ),
    [currenciesByProvider, currency],
  );

  const onAddAccount = useCallback(() => {
    if (llmNetworkBasedAddAccountFlow?.enabled) {
      if (provider && provider?.currenciesByNetwork.length > 1) {
        navigation.navigate(NavigatorName.AssetSelection, {
          screen: ScreenName.SelectNetwork,
          params: {
            currency: currency.id,
            inline: true,
            context: AddAccountContexts.AddAccounts,
            onSuccess: () =>
              navigation.navigate(ScreenName.RequestAccountsSelectAccount, route.params),
          },
        });
      } else {
        navigation.navigate(NavigatorName.DeviceSelection, {
          screen: ScreenName.SelectDevice,
          params: {
            currency: currency as CryptoCurrency,
            context: AddAccountContexts.AddAccounts,
            inline: true,
            onSuccess: () =>
              navigation.navigate(ScreenName.RequestAccountsSelectAccount, route.params),
          },
        });
      }
    } else {
      navigation.navigate(NavigatorName.RequestAccountsAddAccounts, {
        screen: ScreenName.AddAccountsSelectDevice,
        params: {
          currency: currency as CryptoOrTokenCurrency,
          onSuccess: () =>
            navigation.navigate(ScreenName.RequestAccountsSelectAccount, route.params),
        },
      });
    }
  }, [currency, navigation, route.params, llmNetworkBasedAddAccountFlow?.enabled, provider]);

  const renderFooter = useCallback(
    () =>
      allowAddAccount ? (
        <View style={styles.buttonContainer}>
          <Button
            disabled={
              llmNetworkBasedAddAccountFlow?.enabled && providersLoadingStatus === "pending"
            }
            containerStyle={styles.button}
            event="ExchangeStartBuyFlow"
            type="primary"
            title={
              <Trans
                i18nKey={
                  llmNetworkBasedAddAccountFlow?.enabled
                    ? "addAccounts.addNewOrExisting"
                    : "requestAccount.selectAccount.addAccount"
                }
                values={{
                  currency: currency.name,
                }}
              />
            }
            onPress={onAddAccount}
          />
        </View>
      ) : null,
    [
      allowAddAccount,
      currency.name,
      onAddAccount,
      llmNetworkBasedAddAccountFlow?.enabled,
      providersLoadingStatus,
    ],
  );

  const renderList = useCallback(
    (items: { account: AccountLike; subAccount?: SubAccount | null }[]) => (
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
      <KeyboardView style={styles.root}>
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
