import React from "react";
import { renderHook } from "@testing-library/react";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import { I18nTestProvider } from "@shared/i18n/testing";
import { useContactDetailEmptyStateCopy } from "./useContactDetailEmptyStateCopy";

const resources = {
  en: {
    translation: {
      contacts: { detail: { emptyState: { contactTitle: "No saved addresses for {{name}}" } } },
    },
  },
};

function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <I18nTestProvider resources={resources}>{children}</I18nTestProvider>;
}

describe("useContactDetailEmptyStateCopy", () => {
  it("should resolve Me empty state copy", () => {
    const { result } = renderHook(() => useContactDetailEmptyStateCopy(mockMeContact()), {
      wrapper: Wrapper,
    });

    expect(result.current).toEqual({
      title: "contacts.detail.emptyState.meTitle",
      description: "contacts.detail.emptyState.meDescription",
    });
  });

  it("should resolve saved contact empty state copy with the contact name", () => {
    const { result } = renderHook(
      () => useContactDetailEmptyStateCopy(mockContact({ id: "contact-benoit", name: "Benoit" })),
      { wrapper: Wrapper },
    );

    expect(result.current).toEqual({
      title: "No saved addresses for Benoit",
      description: "contacts.detail.emptyState.contactDescription",
    });
  });
});
