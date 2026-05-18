import React, { useCallback, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList, FlashListProps, ListRenderItemInfo } from "@shopify/flash-list";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { TrackScreen } from "~/analytics";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import globalSyncRefreshControl from "~/components/globalSyncRefreshControl";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { CryptoAddressesNavigator } from "./types";
import useCryptoAddressesViewModel from "./useCryptoAddressesViewModel";
import CryptoAddressesListItem from "./components/CryptoAddressesListItem";
import CryptoAddressesFooter, { FOOTER_HEIGHT } from "./components/CryptoAddressesFooter";
import CryptoAddressesEmptyState from "./components/CryptoAddressesEmptyState";
import CryptoAddressesLoadingState from "./components/CryptoAddressesLoadingState";
import CryptoAddressesErrorState from "./components/CryptoAddressesErrorState";

type Props = BaseComposite<
  StackNavigatorProps<CryptoAddressesNavigator, ScreenName.CryptoAddresses>
>;

const SyncList = globalSyncRefreshControl<FlashListProps<Account>>(FlashList);

function CryptoAddressesView({
  accounts,
  aggregatedAccountsData,
  hasNoAccount,
  isLoading,
  error,
  onAccountPress,
  onAddAccountPress,
  onCloseAddAccount,
  isAddAccountOpen,
  addAccountLabel,
  emptyStateLabel,
  trackingPage,
  sourceScreenName,
  hideAddAccount,
}: Readonly<ReturnType<typeof useCryptoAddressesViewModel>>) {
  const { bottom } = useSafeAreaInsets();
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Account>) => {
      const data = aggregatedAccountsData.get(item.id);
      return (
        <CryptoAddressesListItem
          account={item}
          aggregatedCountervalue={data?.countervalue ?? new BigNumber(0)}
          subAccountsCount={data?.subAccountsCount ?? 0}
          onPress={onAccountPress}
        />
      );
    },
    [onAccountPress, aggregatedAccountsData],
  );

  const ListEmpty = useMemo(() => {
    if (isLoading) return <CryptoAddressesLoadingState />;
    return <CryptoAddressesEmptyState label={emptyStateLabel} />;
  }, [isLoading, emptyStateLabel]);

  const listPaddingBottom = hideAddAccount ? bottom : FOOTER_HEIGHT + bottom;

  return (
    <Box style={{ flex: 1 }}>
      <TrackScreen name={trackingPage} source={sourceScreenName} />
      <Box lx={containerStyle}>
        {error ? (
          <CryptoAddressesErrorState />
        ) : (
          <SyncList
            testID="CryptoAddressesList"
            renderItem={renderItem}
            data={accounts}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: listPaddingBottom }}
            ListEmptyComponent={ListEmpty}
          />
        )}
        {!hideAddAccount && (
          <CryptoAddressesFooter label={addAccountLabel} onPress={onAddAccountPress} />
        )}
      </Box>
      {!hideAddAccount && (
        <AddAccountDrawer
          isOpened={isAddAccountOpen}
          onClose={onCloseAddAccount}
          doesNotHaveAccount={hasNoAccount}
        />
      )}
    </Box>
  );
}

export default withDiscreetMode(function CryptoAddressesScreen({ route }: Props) {
  return (
    <CryptoAddressesView
      {...useCryptoAddressesViewModel(
        route.params?.sourceScreenName,
        route.params?.accountIds,
        route.params?.hideAddAccount,
      )}
    />
  );
});

const containerStyle: LumenViewStyle = {
  flex: 1,
  paddingHorizontal: "s8",
};
