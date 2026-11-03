import { useCallback } from "react";
import type { Account } from "@ledgerhq/types-live";
import { track, trackPage } from "@shared/analytics";
import {
  ACCOUNT_DETAIL_BUTTONS,
  ACCOUNT_DETAIL_EVENTS,
  ACCOUNT_DETAIL_PAGES,
  accountButtonClickedProps,
  accountSettingsPageViewProps,
  type AccountDetailButton,
  type AccountDetailPage,
} from "@features/flow-account-detail";
import type { AccountSettingsEvent } from "@features/flow-account-detail-settings";
import { getAccountTrackingFacts } from "../utils/accountTracking";

const SETTINGS_EVENTS: Readonly<
  Record<AccountSettingsEvent, Readonly<{ button: AccountDetailButton; page: AccountDetailPage }>>
> = {
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

export function useAccountSettingsTracking(account: Account | undefined) {
  const onSettingsEvent = useCallback(
    (event: AccountSettingsEvent) => {
      if (!account) return;
      const { button, page } = SETTINGS_EVENTS[event];
      track(
        ACCOUNT_DETAIL_EVENTS.buttonClicked,
        accountButtonClickedProps(getAccountTrackingFacts(account), button, page),
      );
    },
    [account],
  );

  /** The settings button was pressed: the click, then the settings page. */
  const onSettingsOpened = useCallback(() => {
    if (!account) return;
    const facts = getAccountTrackingFacts(account);
    track(
      ACCOUNT_DETAIL_EVENTS.buttonClicked,
      accountButtonClickedProps(facts, ACCOUNT_DETAIL_BUTTONS.accountSettings),
    );
    trackPage({
      category: ACCOUNT_DETAIL_PAGES.settings,
      props: accountSettingsPageViewProps(facts),
    });
  }, [account]);

  return { onSettingsEvent, onSettingsOpened };
}
