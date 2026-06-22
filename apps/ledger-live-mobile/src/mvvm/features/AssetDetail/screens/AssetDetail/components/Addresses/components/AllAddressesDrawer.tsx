import React, { useCallback, useMemo } from "react";
import { ListRenderItemInfo } from "react-native";
import BigNumber from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { BottomSheetFlatList, BottomSheetHeader } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import CryptoAddressesListItem from "LLM/features/CryptoAddresses/screens/CryptoAddressesScreen/components/CryptoAddressesListItem";
import useCryptoAddressesViewModel from "LLM/features/CryptoAddresses/screens/CryptoAddressesScreen/useCryptoAddressesViewModel";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { ASSET_DETAIL_TEST_IDS } from "LLM/features/AssetDetail/testIds";

type Props = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  accountIds: string[];
}>;

export function AllAddressesDrawer({ isOpen, onClose, accountIds }: Props) {
  const { t } = useTranslation();
  const { accounts, aggregatedAccountsData, onAccountPress } = useCryptoAddressesViewModel(
    ScreenName.AssetDetail,
    accountIds,
    true,
  );

  const handleAccountPress = useCallback(
    (account: Account) => {
      onClose();
      onAccountPress(account);
    },
    [onClose, onAccountPress],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Account>) => {
      const data = aggregatedAccountsData.get(item.id);
      return (
        <CryptoAddressesListItem
          account={item}
          aggregatedCountervalue={data?.countervalue ?? new BigNumber(0)}
          subAccountsCount={data?.subAccountsCount ?? 0}
          onPress={handleAccountPress}
          lx={LIST_ITEM_NEGATIVE_OFFSET}
        />
      );
    },
    [aggregatedAccountsData, handleAccountPress],
  );

  const keyExtractor = useCallback((item: Account) => item.id, []);

  const headerTitle = useMemo(() => t("assetDetail.addresses.title"), [t]);

  return (
    <QueuedDrawerBottomSheet
      testID={ASSET_DETAIL_TEST_IDS.allAddressesDrawer}
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      snapPoints="full"
      enableHandlePanningGesture={false}
    >
      <BottomSheetHeader spacing density="expanded" title={headerTitle} />
      <BottomSheetFlatList
        data={accounts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
      />
    </QueuedDrawerBottomSheet>
  );
}

/**
 * Cancels half of the `BottomSheetFlatList` default `paddingHorizontal: s16`
 * so list items end up indented by `s8` from the drawer edge, matching the
 * CryptoAddresses page rendered in the Portfolio context.
 */
const LIST_ITEM_NEGATIVE_OFFSET: LumenViewStyle = { marginHorizontal: "-s8" };
