import { renderHook } from "@testing-library/react";

jest.mock("@domain/api-card-management", () => ({
  useGetCardStatusQuery: jest.fn(),
  useGetCardTransactionsQuery: jest.fn(),
  useGetUserQuery: jest.fn(),
}));

jest.mock("@features/flow-pay-card-wallets", () => ({
  useCardLinkedWallets: jest.fn(),
}));

import {
  useGetCardStatusQuery,
  useGetCardTransactionsQuery,
  useGetUserQuery,
} from "@domain/api-card-management";
import { useCardLinkedWallets } from "@features/flow-pay-card-wallets";
import { useCardOnboardingStatus } from "./useCardOnboardingStatus";

type Verification = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

const refetchUser = jest.fn();
const refetchCardStatus = jest.fn();
const refetchTransactions = jest.fn();
const refetchWallets = jest.fn();

function setupMocks({
  // `null` is "not read yet": an explicit `undefined` would fall back to the default.
  verificationState = "VERIFIED" as Verification | null,
  hasCard = true,
  cardStatus = "ACTIVE",
  balances = [] as (string | null)[],
  transactions = [] as { status: "CONFIRMED" | "PENDING" | "DECLINED" | "REVERTED" }[],
  isUserFetching = false,
  isCardStatusFetching = false,
  areTransactionsFetching = false,
  areWalletsFetching = false,
  isUserError = false,
  isCardStatusError = false,
  areTransactionsError = false,
  areWalletsError = false,
} = {}) {
  jest.mocked(useGetUserQuery).mockReturnValue({
    refetch: refetchUser,
    data: verificationState === null ? undefined : { verificationState },
    isFetching: isUserFetching,
    isError: isUserError,
  } as unknown as ReturnType<typeof useGetUserQuery>);

  jest.mocked(useGetCardStatusQuery).mockReturnValue({
    refetch: refetchCardStatus,
    data: hasCard ? { status: cardStatus } : undefined,
    isFetching: isCardStatusFetching,
    isError: isCardStatusError,
  } as unknown as ReturnType<typeof useGetCardStatusQuery>);

  jest.mocked(useGetCardTransactionsQuery).mockReturnValue({
    refetch: refetchTransactions,
    data: transactions,
    isFetching: areTransactionsFetching,
    isError: areTransactionsError,
  } as unknown as ReturnType<typeof useGetCardTransactionsQuery>);

  jest.mocked(useCardLinkedWallets).mockReturnValue({
    refetch: refetchWallets,
    wallets: balances.map((balance, index) => ({ id: `w${index}`, balance })),
    isFetching: areWalletsFetching,
    isError: areWalletsError,
  } as unknown as ReturnType<typeof useCardLinkedWallets>);
}

function stepsById() {
  const { result } = renderHook(() => useCardOnboardingStatus());
  const { data } = result.current;

  return {
    isDone: (id: string) => data.steps.find(step => step.id === id)?.isDone,
    completedCount: data.completedCount,
    status: result.current,
  };
}

describe("useCardOnboardingStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("the account step", () => {
    it("is done once the provider reports the account verified", () => {
      setupMocks({ verificationState: "VERIFIED" });

      expect(stepsById().isDone("create-account")).toBe(true);
    });

    it.each<Verification>(["UNVERIFIED", "PENDING", "REJECTED"])(
      "is not done while the account reads %s",
      verificationState => {
        setupMocks({ verificationState });

        expect(stepsById().isDone("create-account")).toBe(false);
      },
    );

    it("is not done while the account has not been read", () => {
      setupMocks({ verificationState: null });

      expect(stepsById().isDone("create-account")).toBe(false);
    });
  });

  describe("the card step", () => {
    it.each(["ACTIVE", "INACTIVE", "FROZEN", "BLOCKED"])(
      "counts a %s card as ordered",
      cardStatus => {
        setupMocks({ hasCard: true, cardStatus });

        expect(stepsById().isDone("choose-card-type")).toBe(true);
      },
    );

    it("is not done when the provider answers with no card", () => {
      setupMocks({ hasCard: false });

      expect(stepsById().isDone("choose-card-type")).toBe(false);
    });
  });

  describe("the top-up step", () => {
    it("is done as soon as one linked wallet holds anything", () => {
      setupMocks({ balances: ["0.00", null, "0.00000001"] });

      expect(stepsById().isDone("top-up-card")).toBe(true);
    });

    it.each([[[]], [["0"]], [["0.00", null]]])(
      "is not done for balances %p",
      (balances: (string | null)[]) => {
        setupMocks({ balances });

        expect(stepsById().isDone("top-up-card")).toBe(false);
      },
    );
  });

  describe("the first purchase step", () => {
    it("is done once a confirmed card transaction exists", () => {
      setupMocks({ transactions: [{ status: "CONFIRMED" }] });

      expect(stepsById().isDone("first-purchase")).toBe(true);
    });

    it.each(["PENDING", "DECLINED", "REVERTED"] as const)(
      "is not done when the only transaction is %s",
      status => {
        setupMocks({ transactions: [{ status }] });

        expect(stepsById().isDone("first-purchase")).toBe(false);
      },
    );
  });

  it("counts nothing done for a holder who has only signed up", () => {
    setupMocks({ verificationState: "PENDING", hasCard: false, balances: [] });

    expect(stepsById().completedCount).toBe(0);
  });

  describe("re-asking", () => {
    it("re-asks all four sources", () => {
      setupMocks();
      const { result } = renderHook(() => useCardOnboardingStatus());

      result.current.refresh();

      expect(refetchUser).toHaveBeenCalledTimes(1);
      expect(refetchCardStatus).toHaveBeenCalledTimes(1);
      expect(refetchTransactions).toHaveBeenCalledTimes(1);
      expect(refetchWallets).toHaveBeenCalledTimes(1);
    });

    it("asks nothing while skipped, because a query that never started cannot refetch", () => {
      setupMocks();
      const { result } = renderHook(() => useCardOnboardingStatus({ skip: true }));

      result.current.refresh();

      expect(refetchUser).not.toHaveBeenCalled();
      expect(refetchCardStatus).not.toHaveBeenCalled();
      expect(refetchTransactions).not.toHaveBeenCalled();
      expect(refetchWallets).not.toHaveBeenCalled();
    });
  });

  describe("when the host holds the reads", () => {
    it("asks nothing, so a signed-out host collects no 401s", () => {
      setupMocks();
      renderHook(() => useCardOnboardingStatus({ skip: true }));

      expect(jest.mocked(useGetUserQuery)).toHaveBeenCalledWith(undefined, { skip: true });
      expect(jest.mocked(useGetCardStatusQuery)).toHaveBeenCalledWith(undefined, { skip: true });
      expect(jest.mocked(useGetCardTransactionsQuery)).toHaveBeenCalledWith(undefined, {
        skip: true,
      });
      expect(jest.mocked(useCardLinkedWallets)).toHaveBeenCalledWith(
        expect.objectContaining({ skip: true }),
      );
    });

    it("asks by default, so a host that says nothing gets the answer", () => {
      setupMocks();
      renderHook(() => useCardOnboardingStatus());

      expect(jest.mocked(useGetUserQuery)).toHaveBeenCalledWith(undefined, { skip: false });
    });
  });

  describe("what it reports while asking", () => {
    it.each([
      ["the account", { isUserFetching: true }],
      ["the card", { isCardStatusFetching: true }],
      ["the transactions", { areTransactionsFetching: true }],
      ["the wallets", { areWalletsFetching: true }],
    ])("is loading while %s is in flight, refetches included", (_source, fetching) => {
      setupMocks(fetching);

      expect(stepsById().status.isLoading).toBe(true);
    });

    it("is not loading once every source has answered", () => {
      setupMocks();

      expect(stepsById().status.isLoading).toBe(false);
    });

    it("surfaces a failed account read", () => {
      setupMocks({ isUserError: true });

      expect(stepsById().status.isError).toBe(true);
    });

    it("hides a failed wallet read, which only leaves the top-up step not done", () => {
      setupMocks({ areWalletsError: true, balances: [] });

      const steps = stepsById();
      expect(steps.status.isError).toBe(false);
      expect(steps.status.hasSourceError).toBe(true);
      expect(steps.isDone("top-up-card")).toBe(false);
    });
  });
});
