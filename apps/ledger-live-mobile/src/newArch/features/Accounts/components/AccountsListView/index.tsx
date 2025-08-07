import React, { useCallback, useMemo } from "react";
import { FlashList, FlashListProps } from "@shopify/flash-list";
import { View as RNView } from "react-native";
import useAccountsListViewModel, { type Props } from "./useAccountsListViewModel";
import { AccountLike } from "@ledgerhq/types-live";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Pressable } from "react-native";
import AccountItem from "./components/AccountItem";
import globalSyncRefreshControl from "~/components/globalSyncRefreshControl";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import isEqual from "lodash/isEqual";
import { getEstimatedListSize } from "LLM/utils/getEstimatedListSize";
import { Button as LdlsButton } from "@ldls/ui-rnative";

const ESTIMED_ITEM_SIZE = 150;

type ViewProps = ReturnType<typeof useAccountsListViewModel>;

const View: React.FC<ViewProps> = ({
  accountsToDisplay,
  isSyncEnabled,
  limitNumberOfAccounts,
  ListFooterComponent,
  onAccountPress,
  onContentChange,
}) => {
  const List = useMemo(() => {
    return isSyncEnabled
      ? globalSyncRefreshControl<FlashListProps<AccountLike>>(FlashList)
      : FlashList;
  }, [isSyncEnabled]);

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
          <AccountItem account={item} balance={item.balance} withPlaceholder />
        </Flex>
      </Pressable>
    ),
    [onAccountPress],
  );

  const estimatedListSize = getEstimatedListSize({
    limit: limitNumberOfAccounts,
  });

  return (
    <>
      <LdlsButton appearance="primary">
        <Text>{"Hello"}</Text>
        <RNView className="bg-red-500" />
      </LdlsButton>
      <List
        testID="AccountsList"
        estimatedItemSize={ESTIMED_ITEM_SIZE}
        estimatedListSize={estimatedListSize}
        renderItem={renderItem}
        data={accountsToDisplay}
        ListFooterComponent={ListFooterComponent}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onContentSizeChange={onContentChange}
      />
    </>
  );
};

const AccountsListView: React.FC<Props> = props => {
  const viewModel = useAccountsListViewModel(props);
  return <View {...viewModel} />;
};

export default React.memo(withDiscreetMode(AccountsListView), isEqual);
