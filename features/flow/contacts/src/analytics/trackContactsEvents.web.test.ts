import { ContactIdSchema } from "@domain/entity-contact";
import {
  CONTACTS_EVENT_SOURCE,
  CONTACTS_FLOW,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
  CONTACTS_TRACKING_BUTTON,
} from "./contactsAnalytics.types";
import type { ContactsAnalyticsHelper } from "./createContactsAnalyticsHelper";
import {
  buildContactsSaveAddressClickProperties,
  trackContactAddressDetailQuickAction,
  trackContactsAddAddressClick,
  trackContactsLedgerSyncActivate,
  trackContactsLedgerSyncDismiss,
  trackContactsListContactOpen,
} from "./trackContactsEvents";

function createAnalytics(): ContactsAnalyticsHelper {
  return {
    trackEvent: jest.fn(),
    trackPage: jest.fn(),
    getGlobalProperties: jest.fn(),
  };
}

describe("trackContactsEvents", () => {
  it("should build save-address click properties without changing flow context", () => {
    expect(
      buildContactsSaveAddressClickProperties(
        { flow: "send", contactsCount: 2 },
        {
          page: "address review",
          network: "ethereum",
          asset: "ethereum",
          inputMethod: "manual",
        },
      ),
    ).toEqual({
      flow: "send",
      contactsCount: 2,
      button: CONTACTS_TRACKING_BUTTON.saveAddress,
      page: "address review",
      network: "ethereum",
      asset: "ethereum",
      inputMethod: "manual",
    });
  });

  it("should track list contact opens", () => {
    const analytics = createAnalytics();
    const meContactId = ContactIdSchema.parse("contact-me");
    const contactId = ContactIdSchema.parse("contact-ada");

    trackContactsListContactOpen(analytics, meContactId, meContactId);
    trackContactsListContactOpen(analytics, contactId, meContactId);

    expect(analytics.trackEvent).toHaveBeenNthCalledWith(1, CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.LIST,
      button: CONTACTS_TRACKING_BUTTON.contact,
      page: CONTACTS_PAGE_PROPERTY.CONTACTS,
      myContact: true,
    });
    expect(analytics.trackEvent).toHaveBeenNthCalledWith(2, CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.LIST,
      button: CONTACTS_TRACKING_BUTTON.contact,
      page: CONTACTS_PAGE_PROPERTY.CONTACTS,
      myContact: false,
    });
  });

  it("should track ledger sync gate actions", () => {
    const analytics = createAnalytics();

    trackContactsLedgerSyncDismiss(analytics);
    trackContactsLedgerSyncActivate(analytics);

    expect(analytics.trackEvent).toHaveBeenCalledWith(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.LEDGER_SYNC_GATE,
      button: CONTACTS_TRACKING_BUTTON.dismiss,
      page: CONTACTS_PAGE_PROPERTY.LEDGER_SYNC_GATE,
      flow: CONTACTS_FLOW.CONTACTS,
    });
    expect(analytics.trackEvent).toHaveBeenCalledWith(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.LEDGER_SYNC_GATE,
      button: CONTACTS_TRACKING_BUTTON.activateLedgerSync,
      page: CONTACTS_PAGE_PROPERTY.LEDGER_SYNC_GATE,
      flow: CONTACTS_FLOW.CONTACTS,
    });
  });

  it("should track add address clicks", () => {
    const analytics = createAnalytics();
    const meContactId = ContactIdSchema.parse("contact-me");

    trackContactsAddAddressClick(analytics, meContactId, meContactId);

    expect(analytics.trackEvent).toHaveBeenCalledWith(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.CONTACT_DETAIL,
      button: CONTACTS_TRACKING_BUTTON.addAddress,
      page: CONTACTS_PAGE_PROPERTY.CONTACT_DETAIL,
      isSelf: true,
    });
  });

  it("should track address detail quick actions with optional asset", () => {
    const analytics = createAnalytics();

    trackContactAddressDetailQuickAction(analytics, CONTACTS_TRACKING_BUTTON.edit);
    trackContactAddressDetailQuickAction(analytics, CONTACTS_TRACKING_BUTTON.send, "ETH");

    expect(analytics.trackEvent).toHaveBeenNthCalledWith(1, CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.QUICK_ACTION,
      button: CONTACTS_TRACKING_BUTTON.edit,
      page: CONTACTS_PAGE_PROPERTY.CONTACT_DETAIL,
    });
    expect(analytics.trackEvent).toHaveBeenNthCalledWith(2, CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.QUICK_ACTION,
      button: CONTACTS_TRACKING_BUTTON.send,
      page: CONTACTS_PAGE_PROPERTY.CONTACT_DETAIL,
      asset: "ETH",
    });
  });
});
