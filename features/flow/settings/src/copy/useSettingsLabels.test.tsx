import React, { type ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { I18nTestProvider } from "@shared/i18n/testing";
import { useSettingsLabels } from "./useSettingsLabels";

const resources = {
  en: {
    translation: {
      newSettings: {
        title: "Settings",
        sections: {
          general: "General",
          assetManagement: "Asset management",
          security: "Security",
          privacy: "Privacy",
          about: "About",
        },
      },
    },
  },
};

describe("useSettingsLabels", () => {
  it("gives the page title and one name per section", () => {
    const { result } = renderHook(() => useSettingsLabels(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <I18nTestProvider resources={resources}>{children}</I18nTestProvider>
      ),
    });

    expect(result.current).toEqual({
      title: "Settings",
      sections: {
        general: "General",
        assetManagement: "Asset management",
        security: "Security",
        privacy: "Privacy",
        about: "About",
      },
    });
  });
});
