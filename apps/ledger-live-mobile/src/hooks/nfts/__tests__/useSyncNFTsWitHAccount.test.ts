import { useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useCheckNftAccount } from "@ledgerhq/live-nft-react";
import { useHideSpamCollection } from "../useHideSpamCollection";
import { useSyncNFTsWithAccounts } from "../useSyncNFTsWithAccounts";

import { accountsSelector, orderedVisibleNftsSelector } from "~/reducers/accounts";
import { renderHook } from "@testing-library/react-native";

jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/featureFlags/index", () => ({
  useFeature: jest.fn(),
}));

jest.mock("../useHideSpamCollection", () => ({
  useHideSpamCollection: jest.fn(),
}));

jest.mock("@ledgerhq/live-nft-react", () => ({
  useCheckNftAccount: jest.fn(),
  isThresholdValid: jest.fn(),
  getThreshold: jest.fn(),
}));

describe("useSyncNFTsWithAccounts", () => {
  const mockUseSelector = useSelector as jest.Mock;
  const mockUseFeature = useFeature as jest.Mock;
  const mockUseHideSpamCollection = useHideSpamCollection as jest.Mock;
  const mockUseCheckNftAccount = useCheckNftAccount as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should refetch periodically based on TIMER", () => {
    const mockRefetch = jest.fn();
    const mockAccounts = [{ freshAddress: "0x123" }, { freshAddress: "0x456" }];

    mockUseFeature.mockReturnValue({ enabled: true });
    mockUseHideSpamCollection.mockReturnValue({ enabled: true, hideSpamCollection: jest.fn() });
    mockUseSelector.mockImplementation(selector => {
      if (selector === accountsSelector) return mockAccounts;
      if (selector === orderedVisibleNftsSelector) return [];
      return [];
    });
    mockUseCheckNftAccount.mockReturnValue({ refetch: mockRefetch });

    renderHook(() => useSyncNFTsWithAccounts());

    jest.advanceTimersByTime(5 * 60 * 60 * 1000);

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("should refetch immediately when a new account is added", () => {
    const mockRefetch = jest.fn();
    const initialAccounts = [{ freshAddress: "0x123" }];
    const updatedAccounts = [...initialAccounts, { freshAddress: "0x789" }];

    mockUseFeature.mockReturnValue({ enabled: true });
    mockUseHideSpamCollection.mockReturnValue({ enabled: true, hideSpamCollection: jest.fn() });
    mockUseSelector
      .mockImplementationOnce(selector => {
        if (selector === accountsSelector) return initialAccounts;
        if (selector === orderedVisibleNftsSelector) return [];
        return [];
      })
      .mockImplementationOnce(selector => {
        if (selector === accountsSelector) return updatedAccounts;
        if (selector === orderedVisibleNftsSelector) return [];
        return [];
      });

    mockUseCheckNftAccount.mockReturnValue({ refetch: mockRefetch });

    const { rerender } = renderHook(() => useSyncNFTsWithAccounts());

    rerender({});

    expect(mockRefetch).toHaveBeenCalledTimes(2); // 1 for initial render & 1 for adding new account
  });
});
