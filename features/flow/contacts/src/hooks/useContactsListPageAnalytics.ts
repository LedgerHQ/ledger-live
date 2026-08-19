import { useEffect, useRef } from "react";
import {
  CONTACTS_EVENT_SOURCE,
  CONTACTS_FLOW,
  CONTACTS_PAGE_EVENTS,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
} from "../analytics/contactsAnalytics.types";
import type { ContactsAnalyticsHelper } from "../analytics/createContactsAnalyticsHelper";

export type UseContactsListPageAnalyticsOptions = Readonly<{
  analytics: ContactsAnalyticsHelper;
  searchQuery: string;
  searchHasResults: boolean;
  isLedgerSyncIntroductionOpen: boolean;
}>;

export function useContactsListPageAnalytics({
  analytics,
  searchQuery,
  searchHasResults,
  isLedgerSyncIntroductionOpen,
}: UseContactsListPageAnalyticsOptions): void {
  const hasTrackedListPage = useRef(false);
  const hasTrackedLedgerSyncGate = useRef(false);

  useEffect(() => {
    if (hasTrackedListPage.current) {
      return;
    }

    hasTrackedListPage.current = true;
    analytics.trackPage(CONTACTS_PAGE_EVENTS.CONTACTS, {
      source: CONTACTS_EVENT_SOURCE.LIST,
      page: CONTACTS_PAGE_PROPERTY.CONTACTS,
    });
  }, [analytics]);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length === 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      analytics.trackEvent(CONTACTS_TRACK_EVENTS.SEARCH_QUERY, {
        source: CONTACTS_EVENT_SOURCE.SEARCH,
        page: CONTACTS_PAGE_PROPERTY.CONTACTS,
        queryLength: trimmedQuery.length,
        hasResults: searchHasResults,
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [analytics, searchHasResults, searchQuery]);

  useEffect(() => {
    if (!isLedgerSyncIntroductionOpen) {
      hasTrackedLedgerSyncGate.current = false;
      return;
    }

    if (hasTrackedLedgerSyncGate.current) {
      return;
    }

    hasTrackedLedgerSyncGate.current = true;
    analytics.trackPage(CONTACTS_PAGE_EVENTS.ACTIVATE_LEDGER_SYNC, {
      source: CONTACTS_EVENT_SOURCE.LEDGER_SYNC_GATE,
      flow: CONTACTS_FLOW.CONTACTS,
      previousPage: CONTACTS_PAGE_PROPERTY.CONTACTS,
    });
  }, [analytics, isLedgerSyncIntroductionOpen]);
}
