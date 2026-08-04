import { FlatList } from "react-native";
import { BottomSheetVirtualizedList, BottomSheetHeader, Banner } from "@ledgerhq/lumen-ui-rnative";
import {
  TrackDrawerScreen,
  EVENTS_NAME,
  MODULAR_DRAWER_PAGE_NAME,
  useModularDrawerAnalytics,
} from "../../analytics";
import { useDetailedAccounts, RawDetailedAccount } from "../../hooks/useDetailedAccounts";
import { AccountRow } from "./components/AccountRow";
import { AddAccountButton } from "./components/AddAccountButton";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { modularDrawerFlowSelector, modularDrawerSourceSelector } from "~/reducers/modularDrawer";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import React, { useCallback, useRef } from "react";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { AccountLike } from "@ledgerhq/types-live";

export type AccountSelectionStepProps = {
  onAccountSelected?: (account: AccountLike, parentAccount?: AccountLike) => void;
  asset?: CryptoOrTokenCurrency | null;
  onAddNewAccount: () => void;
  uiUseCase?: string;
};

const HEADER_HEIGHT = 64;
const ROW_HEIGHT = 80;
const MARGIN_BOTTOM = HEADER_HEIGHT + ROW_HEIGHT;

const AccountSelectionContent = ({
  asset,
  onAddNewAccount,
  onAccountSelected,
  uiUseCase,
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
      return <AccountRow account={item} onClick={() => handleAccountSelected(item)} />;
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
      <AddAccountButton label={t("modularDrawer.addAccount")} onClick={onAddNewAccountOnClick} />
    );
  }, [onAddNewAccountOnClick, t, uiUseCase]);

  const [namespace, variant] = uiUseCase?.split(":") ?? [];
  const isPerps = namespace === "perpetuals";
  const isPerpsWithoutVariant = isPerps && !variant;

  const headerTitle = isPerpsWithoutVariant
    ? t("modularDrawer.selectAccountPerpsTitle")
    : t("modularDrawer.selectAccount");

  const headerDescription = isPerpsWithoutVariant
    ? t("modularDrawer.selectAccountPerpsDescription")
    : detailedAccounts.length === 0
      ? t("modularDrawer.emptyAccounts", { network: asset.name })
      : undefined;

  return (
    <>
      <TrackDrawerScreen page={EVENTS_NAME.MODULAR_ACCOUNT_SELECTION} flow={flow} source={source} />
      <BottomSheetHeader
        spacing
        title={headerTitle}
        description={headerDescription}
        density="expanded"
      />
      <BottomSheetVirtualizedList
        ref={listRef}
        scrollToOverflowEnabled={true}
        data={detailedAccounts}
        keyExtractor={(item: RawDetailedAccount) => item.id}
        getItemCount={(data: RawDetailedAccount[]) => data.length}
        getItem={(data: RawDetailedAccount[], index: number) => data[index]}
        renderItem={renderItem}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: MARGIN_BOTTOM,
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
