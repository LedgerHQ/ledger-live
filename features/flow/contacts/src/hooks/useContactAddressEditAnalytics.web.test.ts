import { renderHook } from "@testing-library/react";
import {
  CONTACTS_EVENT_SOURCE,
  CONTACTS_PAGE_EVENTS,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
} from "../analytics/contactsAnalytics.types";
import type { ContactsAnalyticsHelper } from "../analytics/createContactsAnalyticsHelper";
import {
  useContactAddressEditAnalytics,
  type UseContactAddressEditAnalyticsOptions,
} from "./useContactAddressEditAnalytics";

function createAnalytics(): ContactsAnalyticsHelper {
  return {
    trackEvent: jest.fn(),
    trackPage: jest.fn(),
    getGlobalProperties: jest.fn(),
  };
}

const closedSession: UseContactAddressEditAnalyticsOptions = {
  isEditSessionActive: false,
  isRenameOpen: false,
  isSignerMismatchOpen: false,
  asset: "ETH",
  network: "ethereum",
};

const openRename: UseContactAddressEditAnalyticsOptions = {
  ...closedSession,
  isEditSessionActive: true,
  isRenameOpen: true,
};

describe("useContactAddressEditAnalytics", () => {
  it("should track the edit address page when the rename dialog opens", () => {
    const analytics = createAnalytics();
    const { rerender } = renderHook(
      (options: UseContactAddressEditAnalyticsOptions) =>
        useContactAddressEditAnalytics(analytics, options),
      { initialProps: closedSession },
    );

    rerender(openRename);

    expect(analytics.trackPage).toHaveBeenCalledWith(CONTACTS_PAGE_EVENTS.EDIT_ADDRESS, {
      source: CONTACTS_EVENT_SOURCE.EDIT_ADDRESS,
      network: "ethereum",
      asset: "ETH",
    });
  });

  it("should not track the page again when the signer step hides the rename dialog", () => {
    const analytics = createAnalytics();
    const { rerender } = renderHook(
      (options: UseContactAddressEditAnalyticsOptions) =>
        useContactAddressEditAnalytics(analytics, options),
      { initialProps: openRename },
    );

    rerender({ ...openRename, isRenameOpen: false });
    rerender(openRename);

    expect(analytics.trackPage).toHaveBeenCalledTimes(1);
  });

  it("should track the page again for a new edit session", () => {
    const analytics = createAnalytics();
    const { rerender } = renderHook(
      (options: UseContactAddressEditAnalyticsOptions) =>
        useContactAddressEditAnalytics(analytics, options),
      { initialProps: openRename },
    );

    rerender(closedSession);
    rerender(openRename);

    expect(analytics.trackPage).toHaveBeenCalledTimes(2);
  });

  it("should not track the page when the asset and network are unresolved", () => {
    const analytics = createAnalytics();

    renderHook(() =>
      useContactAddressEditAnalytics(analytics, {
        ...openRename,
        asset: undefined,
        network: undefined,
      }),
    );

    expect(analytics.trackPage).not.toHaveBeenCalled();
  });

  it("should track signer mismatch errors once while the dialog is open", () => {
    const analytics = createAnalytics();
    const { rerender } = renderHook(
      (options: UseContactAddressEditAnalyticsOptions) =>
        useContactAddressEditAnalytics(analytics, options),
      { initialProps: openRename },
    );

    rerender({ ...openRename, isSignerMismatchOpen: true });
    rerender({ ...openRename, isSignerMismatchOpen: true });

    expect(analytics.trackEvent).toHaveBeenCalledTimes(1);
    expect(analytics.trackEvent).toHaveBeenCalledWith(CONTACTS_TRACK_EVENTS.ERROR_DISPLAYED, {
      source: CONTACTS_EVENT_SOURCE.EDIT_ADDRESS,
      page: CONTACTS_PAGE_PROPERTY.EDIT_ADDRESS,
      errorType: "signer_mismatch",
    });
  });

  it("should allow signer mismatch tracking again after the dialog closes", () => {
    const analytics = createAnalytics();
    const { rerender } = renderHook(
      (options: UseContactAddressEditAnalyticsOptions) =>
        useContactAddressEditAnalytics(analytics, options),
      { initialProps: { ...openRename, isSignerMismatchOpen: true } },
    );

    rerender(openRename);
    rerender({ ...openRename, isSignerMismatchOpen: true });

    expect(analytics.trackEvent).toHaveBeenCalledTimes(2);
  });
});
