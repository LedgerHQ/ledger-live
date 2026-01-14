import { useSelector } from "~/context/hooks";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useGlobalSyncState } from "@ledgerhq/live-common/bridge/react/useGlobalSyncState";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { hasNoAccountsSelector, isUpToDateSelector } from "~/reducers/accounts";
import { parseBoolean } from "LLM/utils/parseBoolean";
import { TrackingEvent } from "../../../enums";
import { AccountsListNavigator } from "../types";
import { getTicker } from "../utils/getTicker";
import { Account, TokenAccount } from "@ledgerhq/types-live";

export type Props = BaseComposite<
  StackNavigatorProps<AccountsListNavigator, ScreenName.AccountsList>
> & {
  specificAccounts: Account[] | TokenAccount[];
};

export type SpecificAccountsType = ReturnType<typeof useSpecificAccountsListViewModel>;

export default function useSpecificAccountsListViewModel({ route, specificAccounts }: Props) {
  const { params } = route;

  const hasNoAccount = useSelector(hasNoAccountsSelector);
  const isUpToDate = useSelector(isUpToDateSelector);

  const canAddAccount =
    (params?.canAddAccount ? parseBoolean(params?.canAddAccount) : false) && !hasNoAccount;
  const showHeader =
    (params?.showHeader ? parseBoolean(params?.showHeader) : false) && !hasNoAccount;
  const isSyncEnabled = params?.isSyncEnabled ? parseBoolean(params?.isSyncEnabled) : false;
  const sourceScreenName = params?.sourceScreenName;

  const globalSyncState = useGlobalSyncState();
  const syncPending = globalSyncState.pending && !isUpToDate;

  const ticker = getTicker(specificAccounts[0]);
  const currency = getAccountCurrency(specificAccounts[0]);

  const pageTrackingEvent = TrackingEvent.AccountListSummary;
  const currencyToTrack = currency.name;

  return {
    hasNoAccount,
    isSyncEnabled,
    canAddAccount,
    showHeader,
    pageTrackingEvent,
    currencyToTrack,
    currency,
    ticker,
    syncPending,
    sourceScreenName,
    specificAccounts,
  };
}
