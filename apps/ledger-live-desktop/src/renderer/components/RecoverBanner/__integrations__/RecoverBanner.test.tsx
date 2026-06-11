import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";

/** Real `electron-store` is not usable in Jest; keep persistence at the boundary. */
jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
}));

import * as store from "~/renderer/store";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import i18n from "~/renderer/i18n/init";
import RecoverBanner from "../RecoverBanner";

const mockGetStoreValue = jest.mocked(store.getStoreValue);

const recoverFlagState = withFlagOverrides({
  protectServicesDesktop: {
    enabled: true,
    params: {
      bannerSubscriptionNotification: true,
      protectId: "protect-test",
    },
  },
});

describe("RecoverBanner", () => {
  let i18nTranslateSpy: jest.SpyInstance | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    i18nTranslateSpy?.mockRestore();
    i18nTranslateSpy = undefined;
  });

  describe("subscribe-done state (STARGATE_SUBSCRIBE)", () => {
    it("renders secondary dismiss link when i18n includes secondaryCta", async () => {
      mockGetStoreValue.mockImplementation((key: string) => {
        if (key === "SUBSCRIPTION_STATE")
          return LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE;
        if (key === "DISPLAY_BANNER") return "true";
        return undefined;
      });

      render(<RecoverBanner />, { initialState: recoverFlagState });

      // Lumen `Link` is not exposed as `role="link"` here; assert on user-visible copy.
      expect(await screen.findByText(/maybe later/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /add card/i })).toBeInTheDocument();
    });

    it("omits dismiss link when subscribeDone object has no secondaryCta", async () => {
      const originalT = i18n.t.bind(i18n);
      i18nTranslateSpy = jest.spyOn(i18n, "t").mockImplementation((...args: unknown[]) => {
        const [key, options] = args as [string, { returnObjects?: boolean }?];
        if (key === "dashboard.recoverBanner.subscribeDone" && options?.returnObjects) {
          return {
            title: "Reminder",
            description: "Almost done",
            primaryCta: "Continue",
          };
        }
        return originalT(...(args as Parameters<typeof originalT>));
      });

      mockGetStoreValue.mockImplementation((key: string) => {
        if (key === "SUBSCRIPTION_STATE")
          return LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE;
        if (key === "DISPLAY_BANNER") return "true";
        return undefined;
      });

      render(<RecoverBanner />, { initialState: recoverFlagState });

      expect(await screen.findByRole("button", { name: "Continue" })).toBeInTheDocument();
      expect(screen.queryByText(/maybe later/i)).not.toBeInTheDocument();
    });
  });
});
