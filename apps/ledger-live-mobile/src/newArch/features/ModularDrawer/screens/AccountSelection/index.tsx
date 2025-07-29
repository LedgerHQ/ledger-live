import React, { useCallback, useEffect, useRef } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";
import { FlatList } from "react-native";
import { BottomSheetVirtualizedList, useBottomSheetInternal } from "@gorhom/bottom-sheet";
import { AccountItem } from "@ledgerhq/native-ui/pre-ldls/index";
import { TrackDrawerScreen, EVENTS_NAME } from "../../analytics";
import AddAccountButton from "~/newArch/features/Accounts/components/AddAccountButton";
import { useDetailedAccounts } from "../../hooks/useDetailAccount";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { Observable } from "rxjs";
import { Account } from "@ledgerhq/native-ui/pre-ldls/components/";

export type AccountSelectionStepProps = {
  accounts$?: Observable<WalletAPIAccount[]>;
  onAccountSelected?: (account: AccountLike, parentAccount?: AccountLike) => void;
  asset?: CryptoOrTokenCurrency | null;
  flow: string;
  source: string;
};

const HEADER_HEIGHT = 64;
const ROW_HEIGHT = 80;
const MARGIN_BOTTOM = HEADER_HEIGHT + ROW_HEIGHT;

const AccountSelection = ({
  asset,
  flow,
  source,
  accounts$,
  onAccountSelected,
}: Readonly<AccountSelectionStepProps>) => {
  const { detailedAccounts, onAddAccountClick } = useDetailedAccounts(
    asset!,
    flow,
    source,
    accounts$,
    onAccountSelected,
  );
  const { shouldHandleKeyboardEvents } = useBottomSheetInternal();
  const listRef = useRef<FlatList>(null);

  const handleAddAccount = useCallback(() => {
    onAddAccountClick();
  }, [onAddAccountClick]);

  const renderItem = useCallback(
    ({ item }: { item: Account }) => {
      return <AccountItem account={item} onClick={onAddAccountClick} />;
    },
    [onAddAccountClick],
  );

  const renderFooter = useCallback(() => {
    return (
      <AddAccountButton
        onClick={handleAddAccount}
        sourceScreenName={EVENTS_NAME.MODULAR_ACCOUNT_SELECTION}
      />
    );
  }, [handleAddAccount]);

  useEffect(() => {
    shouldHandleKeyboardEvents.value = false;
  }, [shouldHandleKeyboardEvents]);

  return (
    <>
      <TrackDrawerScreen page={EVENTS_NAME.MODULAR_ACCOUNT_SELECTION} flow={flow} source={source} />
      <BottomSheetVirtualizedList
        ref={listRef}
        scrollToOverflowEnabled={true}
        data={detailedAccounts}
        keyExtractor={item => item.id}
        getItemCount={data => data.length}
        getItem={(data, index) => data[index]}
        renderItem={renderItem}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: MARGIN_BOTTOM,
          marginTop: 16,
        }}
      />
    </>
  );
};

export default React.memo(AccountSelection);
