import { renderHook } from "@testing-library/react-native";

jest.mock("@domain/api-card-management", () => ({
  useGetCardStatusQuery: jest.fn(),
  useGetUserQuery: jest.fn(),
}));

jest.mock("@features/flow-pay-card-wallets", () => ({
  useCardLinkedWallets: jest.fn(),
}));

jest.mock("react-redux", () => ({ useSelector: jest.fn() }));

import { useGetCardStatusQuery, useGetUserQuery } from "@domain/api-card-management";
import { useCardLinkedWallets } from "@features/flow-pay-card-wallets";
import { useSelector } from "react-redux";
import { useCardOnboardingStatus } from "./useCardOnboardingStatus.native";

const refetchUser = jest.fn();
const refetchCardStatus = jest.fn();
const refetchWallets = jest.fn();

function setupMocks({ hasAddedCardToWallet = false, verified = false } = {}) {
  jest.mocked(useGetUserQuery).mockReturnValue({
    refetch: refetchUser,
    data: { verificationState: verified ? "VERIFIED" : "PENDING" },
    isFetching: false,
    isError: false,
  } as unknown as ReturnType<typeof useGetUserQuery>);

  jest.mocked(useGetCardStatusQuery).mockReturnValue({
    refetch: refetchCardStatus,
    data: undefined,
    isFetching: false,
    isError: false,
  } as unknown as ReturnType<typeof useGetCardStatusQuery>);

  jest.mocked(useCardLinkedWallets).mockReturnValue({
    refetch: refetchWallets,
    wallets: [],
    isFetching: false,
    isError: false,
  } as unknown as ReturnType<typeof useCardLinkedWallets>);

  // Run the real selector, so the state shape it reads stays covered.
  jest.mocked(useSelector).mockImplementation(selector =>
    (selector as (state: unknown) => unknown)({
      payCardOnboardingWidget: { hasCompletedOnboarding: false, hasAddedCardToWallet },
    }),
  );
}

describe("useCardOnboardingStatus (native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists the phone wallet step before the purchase", () => {
    setupMocks();
    const { result } = renderHook(() => useCardOnboardingStatus());

    expect(result.current.data.steps.map(({ id }) => id)).toEqual([
      "create-account",
      "choose-card-type",
      "top-up-card",
      "apple-google-pay",
      "first-purchase",
    ]);
  });

  it.each([true, false])(
    "reads the phone wallet step from what the device remembers: %s",
    hasAddedCardToWallet => {
      setupMocks({ hasAddedCardToWallet });
      const { result } = renderHook(() => useCardOnboardingStatus());

      const walletStep = result.current.data.steps.find(({ id }) => id === "apple-google-pay");
      expect(walletStep?.isDone).toBe(hasAddedCardToWallet);
    },
  );

  it("holds every read when the host asks it to", () => {
    setupMocks();
    renderHook(() => useCardOnboardingStatus({ skip: true }));

    expect(jest.mocked(useGetUserQuery)).toHaveBeenCalledWith(undefined, { skip: true });
    expect(jest.mocked(useGetCardStatusQuery)).toHaveBeenCalledWith(undefined, { skip: true });
    expect(jest.mocked(useCardLinkedWallets)).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true }),
    );
  });

  it("re-asks all three sources", () => {
    setupMocks();
    const { result } = renderHook(() => useCardOnboardingStatus());

    result.current.refresh();

    expect(refetchUser).toHaveBeenCalledTimes(1);
    expect(refetchCardStatus).toHaveBeenCalledTimes(1);
    expect(refetchWallets).toHaveBeenCalledTimes(1);
  });

  it("asks nothing while skipped, because a query that never started cannot refetch", () => {
    setupMocks();
    const { result } = renderHook(() => useCardOnboardingStatus({ skip: true }));

    result.current.refresh();

    expect(refetchUser).not.toHaveBeenCalled();
    expect(refetchCardStatus).not.toHaveBeenCalled();
    expect(refetchWallets).not.toHaveBeenCalled();
  });

  it("counts the phone wallet step like any other", () => {
    setupMocks({ hasAddedCardToWallet: true, verified: true });
    const { result } = renderHook(() => useCardOnboardingStatus());

    expect(result.current.data.completedCount).toBe(2);
  });
});
