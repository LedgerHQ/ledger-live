import { act, renderHook } from "@testing-library/react";
import {
  CONTACTS_EVENT_SOURCE,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
  CONTACTS_TRACKING_BUTTON,
} from "../../analytics/contactsAnalytics.types";
import type { ContactsAnalyticsHelper } from "../../analytics/createContactsAnalyticsHelper";
import { useContactDetailEditDeleteAnalytics } from "./useContactDetailEditDeleteAnalytics";

function createAnalytics(): ContactsAnalyticsHelper {
  return {
    trackEvent: jest.fn(),
    trackPage: jest.fn(),
    getGlobalProperties: jest.fn(),
  };
}

describe("useContactDetailEditDeleteAnalytics", () => {
  it("should track edit and delete button clicks", () => {
    const analytics = createAnalytics();
    const onEditPress = jest.fn();
    const onDeletePress = jest.fn();
    const openDelete = jest.fn();
    const { result } = renderHook(() =>
      useContactDetailEditDeleteAnalytics(
        analytics,
        { onEditPress, onDeletePress, openDelete },
        false,
      ),
    );

    act(() => {
      result.current.onEdit();
    });
    act(() => {
      result.current.onDelete();
    });

    expect(analytics.trackEvent).toHaveBeenCalledWith(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.CONTACT_DETAIL,
      button: CONTACTS_TRACKING_BUTTON.editContact,
      page: CONTACTS_PAGE_PROPERTY.CONTACT_DETAIL,
    });
    expect(analytics.trackEvent).toHaveBeenCalledWith(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.CONTACT_DETAIL,
      button: CONTACTS_TRACKING_BUTTON.deleteContact,
      page: CONTACTS_PAGE_PROPERTY.CONTACT_DETAIL,
    });
    expect(onEditPress).toHaveBeenCalledTimes(1);
    expect(onDeletePress).toHaveBeenCalledTimes(1);
    expect(openDelete).toHaveBeenCalledTimes(1);
  });

  it("should track signer mismatch errors once while the sheet is open", () => {
    const analytics = createAnalytics();
    const flow = { onEditPress: jest.fn(), onDeletePress: jest.fn(), openDelete: jest.fn() };
    const { rerender } = renderHook(
      ({ isSignerMismatchOpen }) =>
        useContactDetailEditDeleteAnalytics(analytics, flow, isSignerMismatchOpen),
      { initialProps: { isSignerMismatchOpen: false } },
    );

    rerender({ isSignerMismatchOpen: true });

    expect(analytics.trackEvent).toHaveBeenCalledWith(CONTACTS_TRACK_EVENTS.ERROR_DISPLAYED, {
      source: CONTACTS_EVENT_SOURCE.CONTACT_DETAIL,
      page: CONTACTS_PAGE_PROPERTY.CONTACT_DETAIL_SNAKE,
      errorType: "signer_mismatch",
    });

    rerender({ isSignerMismatchOpen: true });

    expect(analytics.trackEvent).toHaveBeenCalledTimes(1);
  });

  it("should allow signer mismatch tracking again after the sheet closes", () => {
    const analytics = createAnalytics();
    const flow = { onEditPress: jest.fn(), onDeletePress: jest.fn(), openDelete: jest.fn() };
    const { rerender } = renderHook(
      ({ isSignerMismatchOpen }) =>
        useContactDetailEditDeleteAnalytics(analytics, flow, isSignerMismatchOpen),
      { initialProps: { isSignerMismatchOpen: true } },
    );

    rerender({ isSignerMismatchOpen: false });
    rerender({ isSignerMismatchOpen: true });

    expect(analytics.trackEvent).toHaveBeenCalledTimes(2);
  });
});
