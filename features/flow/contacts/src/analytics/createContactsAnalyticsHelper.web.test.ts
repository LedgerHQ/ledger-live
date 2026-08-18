import {
  CONTACTS_EVENT_SOURCE,
  CONTACTS_FLOW,
  CONTACTS_PAGE_EVENTS,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
  CONTACTS_TRACKING_BUTTON,
  type ContactsPageEventPayload,
  type ContactsTrackEventPayload,
} from "./contactsAnalytics.types";
import {
  createContactsAnalyticsHelper,
  createNoopContactsAnalyticsAdapter,
} from "./createContactsAnalyticsHelper";

const globalProperties = {
  ffAddressBookEnabled: true,
  contactsCount: 2,
  externalAddressesSavedCount: 1,
  myAddressesSavedCount: 1,
} as const;

describe("createContactsAnalyticsHelper", () => {
  it("merges global properties with track event params before dispatching", () => {
    const track = jest.fn();
    const trackPage = jest.fn();
    const helper = createContactsAnalyticsHelper({ track, trackPage }, () => globalProperties);

    helper.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.ENTRY,
      button: CONTACTS_TRACKING_BUTTON.contacts,
      page: CONTACTS_PAGE_PROPERTY.MY_WALLET,
    });

    expect(track).toHaveBeenCalledWith({
      name: CONTACTS_TRACK_EVENTS.BUTTON_CLICKED,
      properties: {
        ...globalProperties,
        source: CONTACTS_EVENT_SOURCE.ENTRY,
        button: CONTACTS_TRACKING_BUTTON.contacts,
        page: CONTACTS_PAGE_PROPERTY.MY_WALLET,
      },
    });
  });

  it("merges global properties with page event params before dispatching", () => {
    const track = jest.fn();
    const trackPage = jest.fn();
    const helper = createContactsAnalyticsHelper({ track, trackPage }, () => globalProperties);

    helper.trackPage(CONTACTS_PAGE_EVENTS.CONTACT_DETAIL, {
      source: CONTACTS_EVENT_SOURCE.CONTACT_DETAIL,
      isSelf: false,
    });

    expect(trackPage).toHaveBeenCalledWith({
      page: CONTACTS_PAGE_EVENTS.CONTACT_DETAIL,
      properties: {
        ...globalProperties,
        source: CONTACTS_EVENT_SOURCE.CONTACT_DETAIL,
        isSelf: false,
      },
    });
  });

  it("reads the latest global properties on each dispatch", () => {
    let contactsCount = 1;
    const track = jest.fn();
    const trackPage = jest.fn();
    const helper = createContactsAnalyticsHelper({ track, trackPage }, () => ({
      ...globalProperties,
      contactsCount,
    }));

    helper.trackPage(CONTACTS_PAGE_EVENTS.CONTACTS, {
      source: CONTACTS_EVENT_SOURCE.LIST,
      page: CONTACTS_PAGE_PROPERTY.CONTACTS,
    });

    contactsCount = 4;
    helper.trackPage(CONTACTS_PAGE_EVENTS.CONTACTS, {
      source: CONTACTS_EVENT_SOURCE.LIST,
      page: CONTACTS_PAGE_PROPERTY.CONTACTS,
    });

    expect(trackPage).toHaveBeenNthCalledWith(1, {
      page: CONTACTS_PAGE_EVENTS.CONTACTS,
      properties: expect.objectContaining({ contactsCount: 1 }),
    });
    expect(trackPage).toHaveBeenNthCalledWith(2, {
      page: CONTACTS_PAGE_EVENTS.CONTACTS,
      properties: expect.objectContaining({ contactsCount: 4 }),
    });
  });

  it("exposes a noop adapter for tests", () => {
    expect(() =>
      createNoopContactsAnalyticsAdapter().track({
        name: CONTACTS_TRACK_EVENTS.CONTACT_ADDED,
        properties: {
          ...globalProperties,
          source: CONTACTS_EVENT_SOURCE.ADD_CONTACT,
          hasCustomPicture: false,
          flow: CONTACTS_FLOW.CONTACTS,
          page: CONTACTS_PAGE_PROPERTY.ADD_CONTACT,
        },
      }),
    ).not.toThrow();
  });
});

describe("Contacts analytics payload shapes", () => {
  it("accepts typed payloads for each tracking-plan source", () => {
    const entryClick: ContactsTrackEventPayload<typeof CONTACTS_TRACK_EVENTS.BUTTON_CLICKED> = {
      name: CONTACTS_TRACK_EVENTS.BUTTON_CLICKED,
      properties: {
        ...globalProperties,
        source: CONTACTS_EVENT_SOURCE.ENTRY,
        button: CONTACTS_TRACKING_BUTTON.contacts,
        page: CONTACTS_PAGE_PROPERTY.MY_WALLET,
      },
    };

    const searchQuery: ContactsTrackEventPayload<typeof CONTACTS_TRACK_EVENTS.SEARCH_QUERY> = {
      name: CONTACTS_TRACK_EVENTS.SEARCH_QUERY,
      properties: {
        ...globalProperties,
        source: CONTACTS_EVENT_SOURCE.SEARCH,
        page: CONTACTS_PAGE_PROPERTY.CONTACTS,
        queryLength: 3,
        hasResults: true,
      },
    };

    const ledgerSyncClick: ContactsTrackEventPayload<typeof CONTACTS_TRACK_EVENTS.BUTTON_CLICKED> =
      {
        name: CONTACTS_TRACK_EVENTS.BUTTON_CLICKED,
        properties: {
          ...globalProperties,
          source: CONTACTS_EVENT_SOURCE.LEDGER_SYNC_GATE,
          button: CONTACTS_TRACKING_BUTTON.activateLedgerSync,
          page: CONTACTS_PAGE_PROPERTY.LEDGER_SYNC_GATE,
        },
      };

    const contactAdded: ContactsTrackEventPayload<typeof CONTACTS_TRACK_EVENTS.CONTACT_ADDED> = {
      name: CONTACTS_TRACK_EVENTS.CONTACT_ADDED,
      properties: {
        ...globalProperties,
        source: CONTACTS_EVENT_SOURCE.ADD_CONTACT,
        hasCustomPicture: true,
        flow: CONTACTS_FLOW.CONTACTS,
        page: CONTACTS_PAGE_PROPERTY.ADD_CONTACT,
      },
    };

    const addContactError: ContactsTrackEventPayload<typeof CONTACTS_TRACK_EVENTS.ERROR_DISPLAYED> =
      {
        name: CONTACTS_TRACK_EVENTS.ERROR_DISPLAYED,
        properties: {
          ...globalProperties,
          source: CONTACTS_EVENT_SOURCE.ADD_CONTACT,
          page: CONTACTS_PAGE_PROPERTY.ADD_CONTACT,
          errorType: "invalid name",
        },
      };

    const contactDetailPage: ContactsPageEventPayload<typeof CONTACTS_PAGE_EVENTS.CONTACT_DETAIL> =
      {
        page: CONTACTS_PAGE_EVENTS.CONTACT_DETAIL,
        properties: {
          ...globalProperties,
          source: CONTACTS_EVENT_SOURCE.CONTACT_DETAIL,
          isSelf: true,
        },
      };

    const addressAdded: ContactsTrackEventPayload<typeof CONTACTS_TRACK_EVENTS.ADDRESS_ADDED> = {
      name: CONTACTS_TRACK_EVENTS.ADDRESS_ADDED,
      properties: {
        ...globalProperties,
        source: CONTACTS_EVENT_SOURCE.ADD_ADDRESS,
        network: "ethereum",
        asset: "ETH",
        inputMethod: "manual",
        isEns: false,
        flow: CONTACTS_FLOW.CONTACTS,
      },
    };

    const quickAction: ContactsTrackEventPayload<typeof CONTACTS_TRACK_EVENTS.BUTTON_CLICKED> = {
      name: CONTACTS_TRACK_EVENTS.BUTTON_CLICKED,
      properties: {
        ...globalProperties,
        source: CONTACTS_EVENT_SOURCE.QUICK_ACTION,
        button: CONTACTS_TRACKING_BUTTON.send,
        page: CONTACTS_PAGE_PROPERTY.ADDRESS_DETAIL,
        asset: "ETH",
      },
    };

    const addressEdited: ContactsTrackEventPayload<typeof CONTACTS_TRACK_EVENTS.ADDRESS_EDITED> = {
      name: CONTACTS_TRACK_EVENTS.ADDRESS_EDITED,
      properties: {
        ...globalProperties,
        source: CONTACTS_EVENT_SOURCE.EDIT_ADDRESS,
        network: "ethereum",
        asset: "ETH",
        inputMethod: "manual",
        isEns: false,
        flow: CONTACTS_FLOW.CONTACTS,
      },
    };

    const editAddressPage: ContactsPageEventPayload<typeof CONTACTS_PAGE_EVENTS.EDIT_ADDRESS> = {
      page: CONTACTS_PAGE_EVENTS.EDIT_ADDRESS,
      properties: {
        ...globalProperties,
        source: CONTACTS_EVENT_SOURCE.EDIT_ADDRESS,
        network: "ethereum",
        asset: "ETH",
      },
    };

    const applyChangesClick: ContactsTrackEventPayload<
      typeof CONTACTS_TRACK_EVENTS.BUTTON_CLICKED
    > = {
      name: CONTACTS_TRACK_EVENTS.BUTTON_CLICKED,
      properties: {
        ...globalProperties,
        source: CONTACTS_EVENT_SOURCE.EDIT_ADDRESS,
        button: CONTACTS_TRACKING_BUTTON.applyChanges,
        page: CONTACTS_PAGE_PROPERTY.EDIT_ADDRESS,
        network: "ethereum",
        asset: "ETH",
        flow: CONTACTS_FLOW.CONTACTS,
      },
    };

    const payloads = [
      entryClick,
      searchQuery,
      ledgerSyncClick,
      contactAdded,
      addContactError,
      contactDetailPage,
      addressAdded,
      addressEdited,
      editAddressPage,
      applyChangesClick,
      quickAction,
    ];

    for (const payload of payloads) {
      const properties = "properties" in payload ? payload.properties : undefined;
      expect(properties?.ffAddressBookEnabled).toBe(true);
      expect(properties?.source).toBeDefined();
      expect(Object.keys(properties ?? {})).not.toContain("contact_name");
      expect(Object.keys(properties ?? {})).not.toContain("address_label");
      expect(Object.keys(properties ?? {})).not.toContain("account_name");
      expect(Object.keys(properties ?? {})).not.toContain("address");
      expect(Object.keys(properties ?? {})).not.toContain("query");
    }
  });
});
