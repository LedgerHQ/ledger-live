import { useEffect, useRef } from "react";
import {
  CONTACTS_EVENT_SOURCE,
  CONTACTS_PAGE_EVENTS,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
} from "../../analytics/contactsAnalytics.types";
import type { ContactsAnalyticsHelper } from "../../analytics/createContactsAnalyticsHelper";

export type UseContactAddressEditAnalyticsOptions = Readonly<{
  isEditSessionActive: boolean;
  isRenameOpen: boolean;
  isSignerMismatchOpen: boolean;
  asset?: string;
  network?: string;
}>;

export function useContactAddressEditAnalytics(
  analytics: ContactsAnalyticsHelper,
  {
    isEditSessionActive,
    isRenameOpen,
    isSignerMismatchOpen,
    asset,
    network,
  }: UseContactAddressEditAnalyticsOptions,
): void {
  const hasTrackedEditAddressPage = useRef(false);
  const hasTrackedSignerMismatch = useRef(false);

  useEffect(() => {
    if (!isEditSessionActive) {
      hasTrackedEditAddressPage.current = false;
      return;
    }

    if (
      !isRenameOpen ||
      hasTrackedEditAddressPage.current ||
      asset === undefined ||
      network === undefined
    ) {
      return;
    }

    hasTrackedEditAddressPage.current = true;
    analytics.trackPage(CONTACTS_PAGE_EVENTS.EDIT_ADDRESS, {
      source: CONTACTS_EVENT_SOURCE.EDIT_ADDRESS,
      network,
      asset,
    });
  }, [analytics, asset, isEditSessionActive, isRenameOpen, network]);

  useEffect(() => {
    if (isSignerMismatchOpen && !hasTrackedSignerMismatch.current) {
      hasTrackedSignerMismatch.current = true;
      analytics.trackEvent(CONTACTS_TRACK_EVENTS.ERROR_DISPLAYED, {
        source: CONTACTS_EVENT_SOURCE.EDIT_ADDRESS,
        page: CONTACTS_PAGE_PROPERTY.EDIT_ADDRESS,
        errorType: "signer_mismatch",
      });
      return;
    }

    if (!isSignerMismatchOpen) {
      hasTrackedSignerMismatch.current = false;
    }
  }, [analytics, isSignerMismatchOpen]);
}
