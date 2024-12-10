import React, { useCallback, useMemo } from "react";
import { FlashList, FlashListProps } from "@shopify/flash-list";
import useAccountsListViewModel, { type Props } from "./useAccountsListViewModel";
import { Account } from "@ledgerhq/types-live";
import { Flex } from "@ledgerhq/native-ui";
import { Pressable } from "react-native";
import AccountItem from "./components/AccountItem";
import globalSyncRefreshControl from "~/components/globalSyncRefreshControl";

const ESTIMED_ITEM_SIZE = 150;

type ViewProps = ReturnType<typeof useAccountsListViewModel>;

const View: React.FC<ViewProps> = ({ accountsToDisplay, isSyncEnabled, onAccountPress }) => {
  const List = useMemo(() => {
    return isSyncEnabled ? globalSyncRefreshControl<FlashListProps<Account>>(FlashList) : FlashList;
  }, [isSyncEnabled]);

  const renderItem = useCallback(
    ({ item }: { item: Account }) => (
      <Pressable
        style={({ pressed }: { pressed: boolean }) => [
          { opacity: pressed ? 0.5 : 1.0, marginVertical: 12 },
        ]}
        hitSlop={6}
        onPress={onAccountPress.bind(null, item)}
      >
        <Flex height={40} flexDirection="row" columnGap={12}>
          <AccountItem account={item} balance={item.spendableBalance} />
        </Flex>
      </Pressable>
    ),
    [onAccountPress],
  );

  return (
    <List
      testID="AccountsList"
      estimatedItemSize={ESTIMED_ITEM_SIZE}
      renderItem={renderItem}
      data={accountsToDisplay}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    />
  );
};

const AccountsListView: React.FC<Props> = props => {
  const viewModel = useAccountsListViewModel(props);
  return <View {...viewModel} />;
};

export default AccountsListView;
