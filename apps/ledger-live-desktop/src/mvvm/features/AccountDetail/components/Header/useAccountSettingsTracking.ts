import { useCallback } from "react";
import type { Account } from "@ledgerhq/types-live";
import {
  ACCOUNT_DETAIL_BUTTONS,
  ACCOUNT_DETAIL_EVENTS,
  ACCOUNT_DETAIL_PAGES,
  accountButtonClickedProps,
  type AccountDetailButton,
  type AccountDetailPage,
} from "@features/flow-account-detail";
import type { AccountSettingsEvent } from "@features/flow-account-detail-settings";
import { track } from "@shared/analytics";
import { getAccountTrackingFacts } from "../../utils/accountTracking";

type SettingsClick = Readonly<{ button: AccountDetailButton; page: AccountDetailPage }>;

const SETTINGS_CLICKS: Readonly<Record<AccountSettingsEvent, SettingsClick>> = {
  changeName: {
    button: ACCOUNT_DETAIL_BUTTONS.editAccountName,
    page: ACCOUNT_DETAIL_PAGES.settings,
  },
  validateChangeName: {
    button: ACCOUNT_DETAIL_BUTTONS.validateEditAccountName,
    page: ACCOUNT_DETAIL_PAGES.settings,
  },
  viewLogs: { button: ACCOUNT_DETAIL_BUTTONS.viewLogs, page: ACCOUNT_DETAIL_PAGES.settings },
  copyLogs: { button: ACCOUNT_DETAIL_BUTTONS.copyLogs, page: ACCOUNT_DETAIL_PAGES.settings },
  viewExplorer: {
    button: ACCOUNT_DETAIL_BUTTONS.viewInExplorer,
    page: ACCOUNT_DETAIL_PAGES.settings,
  },
  removeFromPortfolio: {
    button: ACCOUNT_DETAIL_BUTTONS.removeFromPortfolio,
    page: ACCOUNT_DETAIL_PAGES.settings,
  },
  validateRemove: {
    button: ACCOUNT_DETAIL_BUTTONS.validateRemoveFromPortfolio,
    page: ACCOUNT_DETAIL_PAGES.removeAccount,
  },
  cancelRemove: {
    button: ACCOUNT_DETAIL_BUTTONS.cancelRemoveFromPortfolio,
    page: ACCOUNT_DETAIL_PAGES.removeAccount,
  },
};

export function useAccountSettingsTracking(
  account: Account,
): (event: AccountSettingsEvent) => void {
  return useCallback(
    event => {
      const { button, page } = SETTINGS_CLICKS[event];
      track(
        ACCOUNT_DETAIL_EVENTS.buttonClicked,
        accountButtonClickedProps(getAccountTrackingFacts(account), button, page),
      );
    },
    [account],
  );
}
