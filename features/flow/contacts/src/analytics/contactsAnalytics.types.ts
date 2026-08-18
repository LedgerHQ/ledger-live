/**
 * Contacts analytics contract aligned with the
 * [Contacts Tracking Plan](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7271088138/Contacts+-+Tracking+Plan).
 *
 * P2 secured account-name tracking is intentionally excluded from Contacts: payloads must never
 * include contact names, address labels, account names, raw blockchain addresses, or raw search
 * queries. For `search_query`, send `queryLength` and `hasResults` instead of the tracking plan's
 * `$query` placeholder to avoid leaking names or address fragments.
 */

import type { ContactsGlobalProperties } from "@features/platform-contacts";

export const CONTACTS_EVENT_SOURCE = {
  ENTRY: "entry",
  LIST: "list",
  SEARCH: "search",
  LEDGER_SYNC_GATE: "ledger_sync_gate",
  ADD_CONTACT: "add_contact",
  PICTURE: "picture",
  CONTACT_DETAIL: "contact_detail",
  ADD_ADDRESS: "add_address",
  EDIT_ADDRESS: "edit_address",
  ADDRESS_DETAIL: "address_detail",
  QUICK_ACTION: "quick_action",
} as const;

export type ContactsEventSource =
  (typeof CONTACTS_EVENT_SOURCE)[keyof typeof CONTACTS_EVENT_SOURCE];

/** track() event names used by Contacts. */
export const CONTACTS_TRACK_EVENTS = {
  BUTTON_CLICKED: "button_clicked",
  SEARCH_QUERY: "search_query",
  ERROR_DISPLAYED: "error_displayed",
  CONTACT_ADDED: "contact_added",
  ADDRESS_ADDED: "address_added",
  ADDRESS_EDITED: "address_edited",
} as const;

export type ContactsTrackEventName =
  (typeof CONTACTS_TRACK_EVENTS)[keyof typeof CONTACTS_TRACK_EVENTS];

/** trackPage() / screen page names used by Contacts. */
export const CONTACTS_PAGE_EVENTS = {
  CONTACTS: "Page Contacts",
  ACTIVATE_LEDGER_SYNC: "Page Activate Ledger Sync",
  ADD_CONTACT: "Page Add Contact",
  CONTACT_DETAIL: "Page Contact detail",
  ADDRESS_DETAIL: "Page Contacts Address detail",
  EDIT_ADDRESS: "Page Edit address",
} as const;

export type ContactsPageEventName =
  (typeof CONTACTS_PAGE_EVENTS)[keyof typeof CONTACTS_PAGE_EVENTS];

/** `page` property values attached to track events. */
export const CONTACTS_PAGE_PROPERTY = {
  MY_WALLET: "My Wallet",
  CONTACTS: "contacts",
  CONTACT_DETAIL: "contact detail",
  CONTACT_DETAIL_SNAKE: "contact_detail",
  ADD_CONTACT: "add contact",
  LEDGER_SYNC_GATE: "ledger sync gate",
  ADDRESS_DETAIL: "address detail",
  EDIT_ADDRESS: "edit address",
} as const;

export type ContactsPageProperty =
  (typeof CONTACTS_PAGE_PROPERTY)[keyof typeof CONTACTS_PAGE_PROPERTY];

export const CONTACTS_TRACKING_BUTTON = {
  contacts: "contacts",
  addContact: "add contact",
  contact: "contact",
  activateLedgerSync: "activate ledger sync",
  dismiss: "dismiss",
  contactPicture: "contact picture",
  saveContact: "save contact",
  editContact: "edit contact",
  deleteContact: "delete contact",
  addAddress: "add address",
  disabledNetworkTooltip: "disabled network tooltip",
  saveAddress: "save address",
  applyChanges: "apply changes",
  send: "send",
  edit: "edit",
  delete: "delete",
} as const;

export type ContactsTrackingButton =
  (typeof CONTACTS_TRACKING_BUTTON)[keyof typeof CONTACTS_TRACKING_BUTTON];

export const CONTACTS_FLOW = {
  CONTACTS: "contacts",
  SEND: "send",
} as const;

export type ContactsFlow = (typeof CONTACTS_FLOW)[keyof typeof CONTACTS_FLOW];

export type ContactsPictureAction = "add" | "change" | "delete";

export type ContactsAddressInputMethod = "paste" | "qr_code" | "manual" | "ens";

export type ContactsAddAddressType = "me" | "other";

export type ContactsAddContactErrorType = "invalid name" | "invalid picture";

export type ContactsContactDetailErrorType = "signer_mismatch";

type WithGlobalProperties<T> = T & ContactsGlobalProperties;

export type ContactsTrackEventInputParams = {
  [CONTACTS_TRACK_EVENTS.BUTTON_CLICKED]: Readonly<{
    source: ContactsEventSource;
    button: ContactsTrackingButton | (string & {});
    page: ContactsPageProperty | (string & {});
    flow?: ContactsFlow | (string & {});
    action?: ContactsPictureAction;
    hasPicture?: boolean;
    myContact?: boolean;
    type?: ContactsAddAddressType;
    asset?: string;
    network?: string;
    inputMethod?: ContactsAddressInputMethod;
  }>;
  [CONTACTS_TRACK_EVENTS.SEARCH_QUERY]: Readonly<{
    source: typeof CONTACTS_EVENT_SOURCE.SEARCH;
    page: typeof CONTACTS_PAGE_PROPERTY.CONTACTS;
    queryLength: number;
    hasResults: boolean;
  }>;
  [CONTACTS_TRACK_EVENTS.ERROR_DISPLAYED]: Readonly<{
    source: ContactsEventSource;
    page: ContactsPageProperty | (string & {});
    errorType: ContactsAddContactErrorType | ContactsContactDetailErrorType | (string & {});
  }>;
  [CONTACTS_TRACK_EVENTS.CONTACT_ADDED]: Readonly<{
    source: typeof CONTACTS_EVENT_SOURCE.ADD_CONTACT;
    hasCustomPicture: boolean;
    flow: ContactsFlow | (string & {});
    page: ContactsPageProperty | (string & {});
  }>;
  [CONTACTS_TRACK_EVENTS.ADDRESS_ADDED]: Readonly<{
    source: typeof CONTACTS_EVENT_SOURCE.ADD_ADDRESS;
    network: string;
    asset: string;
    inputMethod: ContactsAddressInputMethod | (string & {});
    isEns: boolean;
    flow: ContactsFlow | (string & {});
  }>;
  [CONTACTS_TRACK_EVENTS.ADDRESS_EDITED]: Readonly<{
    source: typeof CONTACTS_EVENT_SOURCE.EDIT_ADDRESS;
    network: string;
    asset: string;
    inputMethod: ContactsAddressInputMethod | (string & {});
    isEns: boolean;
    flow: ContactsFlow | (string & {});
  }>;
};

export type ContactsPageEventInputParams = {
  [CONTACTS_PAGE_EVENTS.CONTACTS]: Readonly<{
    source: typeof CONTACTS_EVENT_SOURCE.LIST;
    page: typeof CONTACTS_PAGE_PROPERTY.CONTACTS;
  }>;
  [CONTACTS_PAGE_EVENTS.ACTIVATE_LEDGER_SYNC]: Readonly<{
    source: typeof CONTACTS_EVENT_SOURCE.LEDGER_SYNC_GATE;
    flow: typeof CONTACTS_FLOW.CONTACTS;
    previousPage: string;
  }>;
  [CONTACTS_PAGE_EVENTS.ADD_CONTACT]: Readonly<{
    source: typeof CONTACTS_EVENT_SOURCE.ADD_CONTACT;
    flow: ContactsFlow | (string & {});
  }>;
  [CONTACTS_PAGE_EVENTS.CONTACT_DETAIL]: Readonly<{
    source: typeof CONTACTS_EVENT_SOURCE.CONTACT_DETAIL;
    isSelf: boolean;
  }>;
  [CONTACTS_PAGE_EVENTS.ADDRESS_DETAIL]: Readonly<{
    source: typeof CONTACTS_EVENT_SOURCE.ADDRESS_DETAIL;
    network: string;
    asset: string;
  }>;
  [CONTACTS_PAGE_EVENTS.EDIT_ADDRESS]: Readonly<{
    source: typeof CONTACTS_EVENT_SOURCE.EDIT_ADDRESS;
    network: string;
    asset: string;
  }>;
};

export type ContactsTrackEventParams = {
  [T in ContactsTrackEventName]: WithGlobalProperties<ContactsTrackEventInputParams[T]>;
};

export type ContactsPageEventParams = {
  [T in ContactsPageEventName]: WithGlobalProperties<ContactsPageEventInputParams[T]>;
};

export type ContactsTrackEventPayload<T extends ContactsTrackEventName = ContactsTrackEventName> =
  Readonly<{
    name: T;
    properties: ContactsTrackEventParams[T];
  }>;

export type ContactsPageEventPayload<T extends ContactsPageEventName = ContactsPageEventName> =
  Readonly<{
    page: T;
    properties: ContactsPageEventParams[T];
  }>;
