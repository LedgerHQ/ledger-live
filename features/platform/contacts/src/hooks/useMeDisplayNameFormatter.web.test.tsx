import React from "react";
import { renderHook } from "@testing-library/react";
import { DEFAULT_ME_CONTACT_NAME } from "@domain/entity-contact";
import { I18nTestProvider } from "@shared/i18n/testing";
import { useMeDisplayNameFormatter } from "./useMeDisplayNameFormatter";

const COPY = {
  en: {
    translation: {
      contacts: {
        me: { myAddresses: "My addresses" },
        detail: { meDisplayName: "{{name}} (Me)" },
      },
    },
  },
};

function renderFormatter() {
  return renderHook(() => useMeDisplayNameFormatter(), {
    wrapper: ({ children }) => <I18nTestProvider resources={COPY}>{children}</I18nTestProvider>,
  }).result.current;
}

describe("useMeDisplayNameFormatter", () => {
  it("should suffix my addresses when the me contact was never renamed", () => {
    expect(renderFormatter()(DEFAULT_ME_CONTACT_NAME)).toBe("My addresses (Me)");
  });

  it("should suffix a renamed me contact with the me label", () => {
    expect(renderFormatter()("Alice")).toBe("Alice (Me)");
  });
});
