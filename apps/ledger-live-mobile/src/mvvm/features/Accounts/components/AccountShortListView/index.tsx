import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import { Pressable } from "react-native";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import isEqual from "lodash/isEqual";
import useAccountsListViewModel, { type Props } from "../../hooks/useAccountsListViewModel";
import AccountItem from "../AccountItem";

type ViewProps = ReturnType<typeof useAccountsListViewModel>;

const View: React.FC<ViewProps> = ({ accountsToDisplay, ListFooterComponent, onAccountPress }) => (
  <>
    <Flex testID="AccountsList">
      {accountsToDisplay.map(item => (
        <Pressable
          key={item.id}
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
      ))}
    </Flex>
    {ListFooterComponent}
  </>
);

const Component: React.FC<Props> = props => <View {...useAccountsListViewModel(props)} />;

export const AccountsShortListView = React.memo(withDiscreetMode(Component), isEqual);
