import { hasConfirmedAccountHistory } from "@features/flow-account-detail-analytics-notice";

type HistoricalOperation = Readonly<{ confirmed: boolean }>;

const isConfirmed = (operation: HistoricalOperation) => operation.confirmed;

describe("hasConfirmedAccountHistory", () => {
  it("should exclude an account with only pending operations", () => {
    const account = { operations: [], operationsCount: 0, pendingOperations: [{}] };

    expect(hasConfirmedAccountHistory(account, isConfirmed)).toBe(false);
  });

  it("should exclude unconfirmed explorer operations even with a positive count", () => {
    const account = { operations: [{ confirmed: false }], operationsCount: 1 };

    expect(hasConfirmedAccountHistory(account, isConfirmed)).toBe(false);
  });

  it("should include confirmed history regardless of the balance or price", () => {
    const account = {
      operations: [{ confirmed: true }],
      balance: 0,
      countervalue: undefined,
    };

    expect(hasConfirmedAccountHistory(account, isConfirmed)).toBe(true);
  });

  it("should include confirmed token history when the parent has none", () => {
    expect(
      hasConfirmedAccountHistory(
        { operations: [], subAccounts: [{ operations: [{ confirmed: true }] }] },
        isConfirmed,
      ),
    ).toBe(true);
  });

  it("should exclude pending-only token activity", () => {
    const token = { operations: [{ confirmed: false }], pendingOperations: [{}] };

    expect(hasConfirmedAccountHistory({ operations: [], subAccounts: [token] }, isConfirmed)).toBe(
      false,
    );
  });

  it("should not infer confirmation from unloaded operation counts", () => {
    const account = { operations: [], operationsCount: 2 };

    expect(hasConfirmedAccountHistory(account, isConfirmed)).toBe(false);
  });

  it("should exclude an account without history", () => {
    expect(hasConfirmedAccountHistory({ operations: [], subAccounts: [] }, isConfirmed)).toBe(
      false,
    );
  });
});
