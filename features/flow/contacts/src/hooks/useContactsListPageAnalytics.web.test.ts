import { act, renderHook } from "@testing-library/react";
import {
  CONTACTS_EVENT_SOURCE,
  CONTACTS_FLOW,
  CONTACTS_PAGE_EVENTS,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
} from "../analytics/contactsAnalytics.types";
import type { ContactsAnalyticsHelper } from "../analytics/createContactsAnalyticsHelper";
import { useContactsListPageAnalytics } from "./useContactsListPageAnalytics";

function createAnalytics(): ContactsAnalyticsHelper {
  return {
    trackEvent: jest.fn(),
    trackPage: jest.fn(),
    getGlobalProperties: jest.fn(),
  };
}

describe("useContactsListPageAnalytics", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should track the contacts list page once on mount", () => {
    const analytics = createAnalytics();

    renderHook(() =>
      useContactsListPageAnalytics({
        analytics,
        searchQuery: "",
        searchHasResults: true,
        isLedgerSyncIntroductionOpen: false,
      }),
    );

    expect(analytics.trackPage).toHaveBeenCalledWith(CONTACTS_PAGE_EVENTS.CONTACTS, {
      source: CONTACTS_EVENT_SOURCE.LIST,
      page: CONTACTS_PAGE_PROPERTY.CONTACTS,
    });
    expect(analytics.trackPage).toHaveBeenCalledTimes(1);
  });

  it("should debounce search query analytics", () => {
    const analytics = createAnalytics();
    const { rerender } = renderHook(
      ({ searchQuery, searchHasResults }) =>
        useContactsListPageAnalytics({
          analytics,
          searchQuery,
          searchHasResults,
          isLedgerSyncIntroductionOpen: false,
        }),
      { initialProps: { searchQuery: "", searchHasResults: true } },
    );

    rerender({ searchQuery: "  ada  ", searchHasResults: true });

    expect(analytics.trackEvent).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(analytics.trackEvent).toHaveBeenCalledWith(CONTACTS_TRACK_EVENTS.SEARCH_QUERY, {
      source: CONTACTS_EVENT_SOURCE.SEARCH,
      page: CONTACTS_PAGE_PROPERTY.CONTACTS,
      queryLength: 3,
      hasResults: true,
    });
  });

  it("should not track search analytics for blank queries", () => {
    const analytics = createAnalytics();

    renderHook(() =>
      useContactsListPageAnalytics({
        analytics,
        searchQuery: "   ",
        searchHasResults: false,
        isLedgerSyncIntroductionOpen: false,
      }),
    );

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(analytics.trackEvent).not.toHaveBeenCalled();
  });

  it("should track the ledger sync gate page once while it is open", () => {
    const analytics = createAnalytics();
    const { rerender } = renderHook(
      ({ isLedgerSyncIntroductionOpen }) =>
        useContactsListPageAnalytics({
          analytics,
          searchQuery: "",
          searchHasResults: true,
          isLedgerSyncIntroductionOpen,
        }),
      { initialProps: { isLedgerSyncIntroductionOpen: false } },
    );

    rerender({ isLedgerSyncIntroductionOpen: true });

    expect(analytics.trackPage).toHaveBeenCalledWith(CONTACTS_PAGE_EVENTS.ACTIVATE_LEDGER_SYNC, {
      source: CONTACTS_EVENT_SOURCE.LEDGER_SYNC_GATE,
      flow: CONTACTS_FLOW.CONTACTS,
      previousPage: CONTACTS_PAGE_PROPERTY.CONTACTS,
    });

    rerender({ isLedgerSyncIntroductionOpen: true });

    expect(analytics.trackPage).toHaveBeenCalledTimes(2);
  });

  it("should allow ledger sync gate tracking again after it closes", () => {
    const analytics = createAnalytics();
    const { rerender } = renderHook(
      ({ isLedgerSyncIntroductionOpen }) =>
        useContactsListPageAnalytics({
          analytics,
          searchQuery: "",
          searchHasResults: true,
          isLedgerSyncIntroductionOpen,
        }),
      { initialProps: { isLedgerSyncIntroductionOpen: true } },
    );

    rerender({ isLedgerSyncIntroductionOpen: false });
    rerender({ isLedgerSyncIntroductionOpen: true });

    expect(analytics.trackPage).toHaveBeenCalledWith(
      CONTACTS_PAGE_EVENTS.ACTIVATE_LEDGER_SYNC,
      expect.anything(),
    );
    expect(analytics.trackPage).toHaveBeenCalledTimes(3);
  });
});
