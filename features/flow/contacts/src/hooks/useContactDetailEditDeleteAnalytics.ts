import { useCallback, useEffect, useRef } from "react";
import {
  CONTACTS_EVENT_SOURCE,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
  CONTACTS_TRACKING_BUTTON,
} from "../analytics/contactsAnalytics.types";
import type { ContactsAnalyticsHelper } from "../analytics/createContactsAnalyticsHelper";
import type { UseContactDetailEditDeleteFlowViewModelResult } from "../steps/Detail/editDelete/useContactDetailEditDeleteFlowViewModel";

export function useContactDetailEditDeleteAnalytics(
  analytics: ContactsAnalyticsHelper,
  flow: Pick<
    UseContactDetailEditDeleteFlowViewModelResult,
    "onEditPress" | "onDeletePress" | "openDelete" | "confirmDelete"
  >,
  isSignerMismatchOpen: boolean,
  isSelf: boolean,
) {
  const hasTrackedSignerMismatch = useRef(false);
  const onEdit = useCallback(() => {
    analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.CONTACT_DETAIL,
      button: CONTACTS_TRACKING_BUTTON.editContact,
      page: CONTACTS_PAGE_PROPERTY.CONTACT_DETAIL,
      isSelf,
    });
    flow.onEditPress();
  }, [analytics, flow, isSelf]);
  const onDelete = useCallback(() => {
    flow.onDeletePress();
    flow.openDelete();
  }, [flow]);
  const onConfirmDelete = useCallback(async () => {
    analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.CONTACT_DETAIL,
      button: CONTACTS_TRACKING_BUTTON.deleteContact,
      page: CONTACTS_PAGE_PROPERTY.CONTACT_DETAIL,
    });
    await flow.confirmDelete();
  }, [analytics, flow]);
  const onValidateEdit = useCallback(() => {
    analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.CONTACT_DETAIL,
      button: CONTACTS_TRACKING_BUTTON.validateEditContact,
      page: CONTACTS_PAGE_PROPERTY.CONTACT_DETAIL,
      isSelf,
    });
  }, [analytics, isSelf]);

  useEffect(() => {
    if (isSignerMismatchOpen && !hasTrackedSignerMismatch.current) {
      hasTrackedSignerMismatch.current = true;
      analytics.trackEvent(CONTACTS_TRACK_EVENTS.ERROR_DISPLAYED, {
        source: CONTACTS_EVENT_SOURCE.CONTACT_DETAIL,
        page: CONTACTS_PAGE_PROPERTY.CONTACT_DETAIL_SNAKE,
        errorType: "signer_mismatch",
      });
      return;
    }

    if (!isSignerMismatchOpen) {
      hasTrackedSignerMismatch.current = false;
    }
  }, [analytics, isSignerMismatchOpen]);

  return { onEdit, onDelete, onConfirmDelete, onValidateEdit };
}
