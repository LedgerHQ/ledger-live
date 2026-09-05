import React, { useCallback, useMemo } from "react";
import { FlashList, FlashListProps } from "@shopify/flash-list";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { Flex } from "@ledgerhq/native-ui";
import { Pressable } from "react-native";
import globalSyncRefreshControl from "~/components/globalSyncRefreshControl";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import isEqual from "lodash/isEqual";
import { useSelector } from "~/context/hooks";
import useAccountsListViewModel, { type Props } from "../../hooks/useAccountsListViewModel";
import { accountsSelector } from "~/reducers/accounts";
import AccountItem from "../AccountItem";

// ponytail: parent-id → Account map, built ONCE per accounts change at list level.
// O(N + M) (N parents, M sub-accounts) instead of O(N) find per row in
// useAccountItemModel. Upgrade path: migrate the other AccountItem call sites
// (AccountShortListView, AccountListDrawer, SelectableAccountsList, ...) to the
// same pattern so the per-row fallback subscription can be deleted.
const useParentById = (): ReadonlyMap<string, Account> => {
  const allAccounts = useSelector(accountsSelector);
  return useMemo(() => {
    const map = new Map<string, Account>();
    for (const a of allAccounts) {
      for (const sub of a.subAccounts ?? []) map.set(sub.id, a);
    }
    return map;
  }, [allAccounts]);
};

type ViewProps = ReturnType<typeof useAccountsListViewModel>;

const View: React.FC<ViewProps> = ({
  accountsToDisplay,
  isSyncEnabled,
  ListFooterComponent,
  onAccountPress,
  onContentChange,
}) => {
  const List = useMemo(() => {
    return isSyncEnabled
      ? globalSyncRefreshControl<FlashListProps<AccountLike>>(FlashList)
      : FlashList;
  }, [isSyncEnabled]);

  // parentAccount is only needed for token rows; passing it explicitly kills
  // the per-row `accountsSelector` subscription + O(N) find in AccountItem.
  const parentById = useParentById();

  const renderItem = useCallback(
    ({ item }: { item: AccountLike }) => (
      <Pressable
        style={({ pressed }: { pressed: boolean }) => [
          { opacity: pressed ? 0.5 : 1.0, marginVertical: 12 },
        ]}
        hitSlop={6}
        onPress={onAccountPress.bind(null, item)}
      >
        <Flex height={40} flexDirection="row" columnGap={12}>
          <AccountItem
            account={item}
            balance={item.balance}
            withPlaceholder
            parentAccount={parentById.get(item.id)}
          />
        </Flex>
      </Pressable>
    ),
    [onAccountPress, parentById],
  );

  return (
    <List
      testID="AccountsList"
      renderItem={renderItem}
      data={accountsToDisplay}
      ListFooterComponent={ListFooterComponent}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      onContentSizeChange={onContentChange}
    />
  );
};

const AccountsListView: React.FC<Props> = props => {
  const viewModel = useAccountsListViewModel(props);
  return <View {...viewModel} />;
};

export default React.memo(withDiscreetMode(AccountsListView), isEqual);
