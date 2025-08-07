import React, { useCallback, useRef } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";
import { FlatList } from "react-native";
import { BottomSheetVirtualizedList } from "@gorhom/bottom-sheet";
import { AccountItem } from "@ledgerhq/native-ui/pre-ldls/index";
import { TrackDrawerScreen, EVENTS_NAME } from "../../analytics";
import { useDetailedAccounts } from "../../hooks/useDetailedAccounts";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { Observable } from "rxjs";
import { AccountUI } from "@ledgerhq/native-ui/pre-ldls/components/";
import { AddAccountButton } from "@ledgerhq/native-ui/pre-ldls/components/index";
import { useTranslation } from "react-i18next";

export type AccountSelectionStepProps = {
  accounts$?: Observable<WalletAPIAccount[]>;
  onAccountSelected?: (account: AccountLike, parentAccount?: AccountLike) => void;
  asset?: CryptoOrTokenCurrency | null;
  flow: string;
  source: string;
  onAddNewAccount: () => void;
};

const HEADER_HEIGHT = 64;
const ROW_HEIGHT = 80;
const MARGIN_BOTTOM = HEADER_HEIGHT + ROW_HEIGHT;

const AccountSelectionContent = ({
  asset,
  flow,
  source,
  accounts$,
  onAddNewAccount,
  onAccountSelected,
}: Readonly<AccountSelectionStepProps> & { asset: CryptoOrTokenCurrency }) => {
  const { detailedAccounts, handleAccountSelected } = useDetailedAccounts(
    asset,
    flow,
    source,
    onAccountSelected,
    accounts$,
  );
  const listRef = useRef<FlatList>(null);
  const { t } = useTranslation();

  const renderItem = useCallback(
    ({ item }: { item: AccountUI }) => {
      return <AccountItem account={item} onClick={() => handleAccountSelected(item)} />;
    },
    [handleAccountSelected],
  );

  const renderFooter = useCallback(() => {
    return <AddAccountButton label={t("addAccounts.addNewOrExisting")} onClick={onAddNewAccount} />;
  }, [onAddNewAccount, t]);

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
const AccountSelection = (props: AccountSelectionStepProps) => {
  if (!props.asset) return null;
  return <AccountSelectionContent {...props} asset={props.asset} />;
};

export default React.memo(AccountSelection);
