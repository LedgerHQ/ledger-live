import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList, SafeAreaView, ListRenderItem } from "react-native";
import { Trans } from "react-i18next";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useAccountsByCryptoCurrency } from "~/hooks/useAccountsByCryptoCurrency";
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
import { AddAccountContexts } from "LLM/features/Accounts/screens/AddAccount/enums";
import { withDiscreetMode } from "~/context/DiscreetModeContext";

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
  items: { account: AccountLike; subAccount?: TokenAccount | null }[];
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
  const { currency, allowAddAccount, onSuccess } = route.params;
  const accounts = useAccountsByCryptoCurrency(currency);
  const onSelect = useCallback(
    (account: AccountLike, parentAccount?: Account) => {
      const n =
        navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>() || navigation;

      // Navigation Conflict Resolution:
      //
      // Problem: RequestAccount screen automatically calls n.pop() after onSuccess,
      // but some onSuccess callbacks (like staking flows) navigate to new screens.
      // This creates a race condition where:
      // 1. onSuccess navigates to a new flow (e.g., CosmosDelegationFlow)
      // 2. RequestAccount immediately pops, undoing the navigation
      // 3. User ends up back at portfolio instead of the intended flow
      //
      // So, we check if onSuccess actually navigated before popping:
      // - Track navigation stack size before calling onSuccess
      // - Use setTimeout(0) to defer the check until after React Navigation processes
      // - Only pop if no new route was added (stack size unchanged),
      //   meaning we are in drawer case
      //
      // Covered behaviors:
      // - Drawer navigation: onSuccess opens drawer → no stack change → we pop as usual
      // - Navigator flows: onSuccess navigates to flow → stack grows → we don't pop
      const initialRouteCount = n.getState().routes.length;

      onSuccess && onSuccess(account, parentAccount);

      setTimeout(() => {
        const currentRouteCount = n.getState().routes.length;
        if (currentRouteCount === initialRouteCount) {
          n.pop();
        }
      }, 0);
    },
    [navigation, onSuccess],
  );

  const renderItem: ListRenderItem<SearchResult> = useCallback(
    ({ item }) => <Item item={item} onSelect={onSelect} />,
    [onSelect],
  );

  const navigateOnAddAccountSuccess = useCallback(() => {
    navigation.navigate(NavigatorName.RequestAccount, {
      screen: ScreenName.RequestAccountsSelectAccount,
      params: {
        ...route.params,
      },
    });
  }, [route.params, navigation]);

  const onAddAccount = useCallback(() => {
    navigation.navigate(NavigatorName.DeviceSelection, {
      screen: ScreenName.SelectDevice,
      params: {
        currency:
          currency.type === "TokenCurrency"
            ? currency.parentCurrency
            : (currency as CryptoCurrency),
        context: AddAccountContexts.AddAccounts,
        inline: true,
        sourceScreenName: ScreenName.RequestAccountsSelectAccount,
        onSuccess: navigateOnAddAccountSuccess,
      },
    });
  }, [currency, navigation, navigateOnAddAccountSuccess]);

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
                i18nKey={"addAccounts.addNewOrExisting"}
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
    (items: { account: AccountLike; subAccount?: TokenAccount | null }[]) => (
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
export default withDiscreetMode(SelectAccount);
