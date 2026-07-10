export type ContactsTrackingEvent = Readonly<{
  name:
    | "contacts-entry-opened"
    | "contacts-search-updated"
    | "contacts-add-contact-submitted"
    | "contacts-add-address-submitted"
    | "contacts-detail-opened";
  properties?: Readonly<Record<string, boolean | number | string | undefined>>;
}>;

export type ContactsTrackingPort = Readonly<{
  trackContactsEvent(event: ContactsTrackingEvent): void;
}>;
