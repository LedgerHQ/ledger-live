import { useSelector } from "react-redux";
import { useGlobalSyncState } from "@ledgerhq/live-common/bridge/react/useGlobalSyncState";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { hasNoAccountsSelector, isUpToDateSelector } from "~/reducers/accounts";
import { parseBoolean } from "LLM/utils/parseBoolean";
import { TrackingEvent } from "../../../enums";
import { AccountsListNavigator } from "../types";
export type Props = BaseComposite<
  StackNavigatorProps<AccountsListNavigator, ScreenName.AccountsList>
>;

export type GenericAccountsType = ReturnType<typeof useGenericAccountsListViewModel>;

export default function useGenericAccountsListViewModel({ route }: Props) {
  const { params } = route;

  const hasNoAccount = useSelector(hasNoAccountsSelector);
  const isUpToDate = useSelector(isUpToDateSelector);

  const canAddAccount =
    (params?.canAddAccount ? parseBoolean(params?.canAddAccount) : false) && !hasNoAccount;
  const showHeader =
    (params?.showHeader ? parseBoolean(params?.showHeader) : false) && !hasNoAccount;
  const isSyncEnabled = params?.isSyncEnabled ? parseBoolean(params?.isSyncEnabled) : false;
  const sourceScreenName = params?.sourceScreenName;
  const specificAccounts = params?.specificAccounts;

  const globalSyncState = useGlobalSyncState();
  const syncPending = globalSyncState.pending && !isUpToDate;

  const pageTrackingEvent = TrackingEvent.AccountsList;

  return {
    hasNoAccount,
    isSyncEnabled,
    canAddAccount,
    showHeader,
    pageTrackingEvent,
    syncPending,
    sourceScreenName,
    specificAccounts,
  };
}
