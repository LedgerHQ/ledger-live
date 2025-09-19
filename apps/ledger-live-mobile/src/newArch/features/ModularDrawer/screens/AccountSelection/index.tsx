import { AccountLike } from "@ledgerhq/types-live";
import { FlatList } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import {
  TrackDrawerScreen,
  EVENTS_NAME,
  MODULAR_DRAWER_PAGE_NAME,
  useModularDrawerAnalytics,
} from "../../analytics";
import { useDetailedAccounts, RawDetailedAccount } from "../../hooks/useDetailedAccounts";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { Observable } from "rxjs";
import {
  AddAccountButton,
  AccountItem,
  AccountUI,
} from "@ledgerhq/native-ui/pre-ldls/components/index";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { modularDrawerFlowSelector, modularDrawerSourceSelector } from "~/reducers/modularDrawer";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { useCallback, useRef } from "react";
import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export type AccountSelectionStepProps = {
  accounts$?: Observable<WalletAPIAccount[]>;
  onAccountSelected?: (account: AccountLike, parentAccount?: AccountLike) => void;
  asset?: CryptoOrTokenCurrency | null;
  onAddNewAccount: () => void;
};

const HEADER_HEIGHT = 64;
const ROW_HEIGHT = 80;
const MARGIN_BOTTOM = HEADER_HEIGHT + ROW_HEIGHT;

const AccountSelectionContent = ({
  asset,
  accounts$,
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
    accounts$,
  );
  const listRef = useRef<FlatList<AccountUI>>(null);
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
      <Flex flexGrow={1}>
        <FlatList
          ref={listRef}
          data={detailedAccounts}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: MARGIN_BOTTOM,
            marginTop: 16,
          }}
        />
      </Flex>
    </>
  );
};
const AccountSelection = (props: AccountSelectionStepProps) => {
  if (!props.asset) return null;
  return <AccountSelectionContent {...props} asset={props.asset} />;
};

export default withDiscreetMode(React.memo(AccountSelection));
