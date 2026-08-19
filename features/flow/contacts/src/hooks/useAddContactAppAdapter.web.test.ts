import { act, renderHook } from "@testing-library/react";
import {
  contact,
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
} from "@domain/entity-contact";
import type { ContactCreationPort } from "@features/flow-contacts-add-contact";
import { useContacts } from "@features/platform-contacts";
import {
  CONTACTS_EVENT_SOURCE,
  CONTACTS_FLOW,
  CONTACTS_PAGE_EVENTS,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
  CONTACTS_TRACKING_BUTTON,
} from "../analytics/contactsAnalytics.types";
import type { ContactsAnalyticsHelper } from "../analytics/createContactsAnalyticsHelper";
import { useAddContactAppAdapter } from "./useAddContactAppAdapter";

jest.mock("@features/platform-contacts", () => ({
  ...jest.requireActual("@features/platform-contacts"),
  useContacts: jest.fn(),
}));

const mockedUseContacts = jest.mocked(useContacts);

const labels = {
  title: "Add contact",
  namePlaceholder: "Contact name",
  namingDisclaimer: "Use a nickname.",
  confirmName: "Confirm name",
  nameValidationErrors: {
    [INVALID_CONTACT_NAME_ERROR_NAME]: "Invalid name",
    [DUPLICATE_CONTACT_NAME_ERROR_NAME]: "Duplicate name",
  },
} as const;

function createAnalytics(): ContactsAnalyticsHelper {
  return {
    trackEvent: jest.fn(),
    trackPage: jest.fn(),
    getGlobalProperties: jest.fn(),
  };
}

function renderAdapter(onSaveSuccess = jest.fn()) {
  const analytics = createAnalytics();
  const contactCreation: ContactCreationPort = {
    createContact: jest.fn(async ({ name }) =>
      contact({
        id: "contact-ada",
        isMe: false,
        name,
        addresses: [],
      }),
    ),
  };

  const rendered = renderHook(() =>
    useAddContactAppAdapter({
      analytics,
      contactCreation,
      onSaveSuccess,
      labels,
    }),
  );

  return { ...rendered, analytics, contactCreation, onSaveSuccess };
}

describe("useAddContactAppAdapter", () => {
  beforeEach(() => {
    mockedUseContacts.mockReturnValue([]);
  });

  it("should track open analytics and open the drawer", () => {
    const { result, analytics } = renderAdapter();

    act(() => {
      result.current.onOpen();
    });

    expect(result.current.isOpen).toBe(true);
    expect(analytics.trackEvent).toHaveBeenCalledWith(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.LIST,
      button: CONTACTS_TRACKING_BUTTON.addContact,
      page: CONTACTS_PAGE_PROPERTY.CONTACTS,
    });
    expect(analytics.trackPage).toHaveBeenCalledWith(CONTACTS_PAGE_EVENTS.ADD_CONTACT, {
      source: CONTACTS_EVENT_SOURCE.ADD_CONTACT,
      flow: CONTACTS_FLOW.CONTACTS,
    });
  });

  it("should not track save when the contact name is invalid", async () => {
    const { result, analytics } = renderAdapter();

    act(() => {
      result.current.onOpen();
      result.current.onDraftNameChange("Ada@1");
    });

    await act(async () => {
      await result.current.onConfirm();
    });

    expect(analytics.trackEvent).not.toHaveBeenCalledWith(
      CONTACTS_TRACK_EVENTS.BUTTON_CLICKED,
      expect.objectContaining({
        button: CONTACTS_TRACKING_BUTTON.saveContact,
      }),
    );
  });

  it("should track save, contact added, and call onSaveSuccess for a valid contact", async () => {
    const { result, analytics, onSaveSuccess } = renderAdapter();

    act(() => {
      result.current.onOpen();
      result.current.onDraftNameChange("Ada");
    });

    await act(async () => {
      await result.current.onConfirm();
    });

    expect(analytics.trackEvent).toHaveBeenCalledWith(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.ADD_CONTACT,
      button: CONTACTS_TRACKING_BUTTON.saveContact,
      page: CONTACTS_PAGE_PROPERTY.ADD_CONTACT,
      hasPicture: false,
      flow: CONTACTS_FLOW.CONTACTS,
    });
    expect(analytics.trackEvent).toHaveBeenCalledWith(CONTACTS_TRACK_EVENTS.CONTACT_ADDED, {
      source: CONTACTS_EVENT_SOURCE.ADD_CONTACT,
      hasCustomPicture: false,
      flow: CONTACTS_FLOW.CONTACTS,
      page: CONTACTS_PAGE_PROPERTY.ADD_CONTACT,
    });
    expect(onSaveSuccess).toHaveBeenCalledTimes(1);
    expect(result.current.isOpen).toBe(false);
  });

  it("should track invalid name errors once while the error is visible", () => {
    const { result, analytics } = renderAdapter();

    act(() => {
      result.current.onOpen();
      result.current.onDraftNameChange("Ada@1");
    });

    expect(analytics.trackEvent).toHaveBeenCalledWith(CONTACTS_TRACK_EVENTS.ERROR_DISPLAYED, {
      source: CONTACTS_EVENT_SOURCE.ADD_CONTACT,
      page: CONTACTS_PAGE_PROPERTY.ADD_CONTACT,
      errorType: "invalid name",
    });

    act(() => {
      result.current.onDraftNameChange("Ada@1!");
    });

    expect(analytics.trackEvent).toHaveBeenCalledTimes(2);
  });

  it("should reset invalid name error tracking when the error clears", () => {
    const { result, analytics } = renderAdapter();

    act(() => {
      result.current.onOpen();
      result.current.onDraftNameChange("Ada@1");
    });

    act(() => {
      result.current.onDraftNameChange("Ada");
    });

    act(() => {
      result.current.onDraftNameChange("Ada@1");
    });

    expect(analytics.trackEvent).toHaveBeenCalledTimes(3);
  });
});
