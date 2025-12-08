import { FlatList } from "react-native";
import { BottomSheetVirtualizedList } from "@gorhom/bottom-sheet";
import {
  TrackDrawerScreen,
  EVENTS_NAME,
  MODULAR_DRAWER_PAGE_NAME,
  useModularDrawerAnalytics,
} from "../../analytics";
import { useDetailedAccounts, RawDetailedAccount } from "../../hooks/useDetailedAccounts";
import { AddAccountButton, AccountItem } from "@ledgerhq/native-ui/pre-ldls/components/index";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { modularDrawerFlowSelector, modularDrawerSourceSelector } from "~/reducers/modularDrawer";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import React, { useCallback, useRef } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";

export type AccountSelectionStepProps = {
  onAccountSelected?: (account: AccountLike, parentAccount?: AccountLike) => void;
  asset?: CryptoOrTokenCurrency | null;
  onAddNewAccount: () => void;
};

const HEADER_HEIGHT = 64;
const ROW_HEIGHT = 80;
const MARGIN_BOTTOM = HEADER_HEIGHT + ROW_HEIGHT;

const AccountSelectionContent = ({
  asset,
  onAddNewAccount,
  onAccountSelected,
}: Readonly<AccountSelectionStepProps> & { asset: CryptoOrTokenCurrency }) => {
  const flow = useSelector(modularDrawerFlowSelector);
  const source = useSelector(modularDrawerSourceSelector);
  const { detailedAccounts, handleAccountSelected } = useDetailedAccounts(
    asset,
    flow,
    source,
    onAccountSelected,
  );
  const listRef = useRef<FlatList>(null);
  const { t } = useTranslation();

  const renderItem = useCallback(
    ({ item }: { item: RawDetailedAccount }) => {
      return (
        <AccountItem
          account={item}
          onClick={() => handleAccountSelected(item)}
          cryptoIconBackgroundColor="transparent"
        />
      );
    },
    [handleAccountSelected],
  );
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
  const onAddNewAccountOnClick = useCallback(() => {
    onAddNewAccount();
    trackModularDrawerEvent("button_clicked", {
      page: MODULAR_DRAWER_PAGE_NAME.MODULAR_ACCOUNT_SELECTION,
      flow,
      source,
      button: "add_a_new_account",
    });
  }, [flow, onAddNewAccount, source, trackModularDrawerEvent]);

  const renderFooter = useCallback(() => {
    return (
      <AddAccountButton
        label={t("addAccounts.addNewOrExisting")}
        onClick={onAddNewAccountOnClick}
      />
    );
  }, [onAddNewAccountOnClick, t]);

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

export default withDiscreetMode(React.memo(AccountSelection));
