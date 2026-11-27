import { renderHook } from "@testing-library/react";
import { I18nWrapper } from "../__tests__/i18nWrapper";
import { usePrivacySettingsLabels } from "./usePrivacySettingsLabels";

describe("usePrivacySettingsLabels", () => {
  it("gives the title and description of every row", () => {
    const { result } = renderHook(() => usePrivacySettingsLabels(), { wrapper: I18nWrapper });

    expect(result.current).toEqual({
      bugReports: {
        title: "Bug reports",
        description: "Automatically send reports to help Ledger improve its products.",
      },
      appPerformance: {
        title: "App performance",
        description: "Enable Ledger to collect app usage to enhance the experience",
      },
      personalizedExperience: {
        title: "Personalized experience",
        description: "Enable Ledger to collect app usage to provide personalized recommendations",
      },
      analytics: {
        title: "Analytics",
        description: "Enable analytics to help Ledger improve user experience.",
      },
      privacyPolicy: {
        title: "Privacy policy",
        description: "See what personal data are collected, why and how they are used",
      },
    });
  });
});
