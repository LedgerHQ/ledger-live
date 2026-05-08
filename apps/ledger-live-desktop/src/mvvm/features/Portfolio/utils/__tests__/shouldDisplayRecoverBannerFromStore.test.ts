import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import shouldDisplayRecoverBannerFromStore from "../shouldDisplayRecoverBannerFromStore";

jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
}));

import * as store from "~/renderer/store";

const mockGetStoreValue = jest.mocked(store.getStoreValue);

describe("shouldDisplayRecoverBannerFromStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns true when subscription is in progress and banner is not dismissed", () => {
    mockGetStoreValue.mockImplementation((key: string) => {
      if (key === "SUBSCRIPTION_STATE") return LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE;
      if (key === "DISPLAY_BANNER") return "true";
      return undefined;
    });

    expect(shouldDisplayRecoverBannerFromStore("protect-test")).toBe(true);
  });

  it("returns true when DISPLAY_BANNER is missing (same default as mobile recoverState)", () => {
    mockGetStoreValue.mockImplementation((key: string) => {
      if (key === "SUBSCRIPTION_STATE") return LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE;
      return undefined;
    });

    expect(shouldDisplayRecoverBannerFromStore("protect-test")).toBe(true);
  });

  it("returns false when DISPLAY_BANNER is false", () => {
    mockGetStoreValue.mockImplementation((key: string) => {
      if (key === "SUBSCRIPTION_STATE") return LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE;
      if (key === "DISPLAY_BANNER") return "false";
      return undefined;
    });

    expect(shouldDisplayRecoverBannerFromStore()).toBe(false);
  });

  it("returns false when subscription is not in progress", () => {
    mockGetStoreValue.mockImplementation((key: string) => {
      if (key === "SUBSCRIPTION_STATE") return LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION;
      if (key === "DISPLAY_BANNER") return "true";
      return undefined;
    });

    expect(shouldDisplayRecoverBannerFromStore()).toBe(false);
  });

  it("returns false when subscription is BACKUP_DONE", () => {
    mockGetStoreValue.mockImplementation((key: string) => {
      if (key === "SUBSCRIPTION_STATE") return LedgerRecoverSubscriptionStateEnum.BACKUP_DONE;
      if (key === "DISPLAY_BANNER") return "true";
      return undefined;
    });

    expect(shouldDisplayRecoverBannerFromStore()).toBe(false);
  });

  it("returns false when getStoreValue throws", () => {
    mockGetStoreValue.mockImplementation(() => {
      throw new Error("store error");
    });

    expect(shouldDisplayRecoverBannerFromStore()).toBe(false);
  });
});
