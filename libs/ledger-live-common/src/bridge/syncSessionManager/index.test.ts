import { createSyncSessionManager } from ".";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { setSupportedCurrencies } from "../../currencies";
import { genAccount } from "../../mock/account";

jest.mock("@ledgerhq/logs", () => ({
  log: jest.fn(),
}));

setSupportedCurrencies(["bitcoin", "ethereum"]);

describe("syncSessionManager", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test("tracks SyncSuccessAllAccounts with correct aggregates when all accounts complete", () => {
    const trackAnalytics = jest.fn();
    const session = createSyncSessionManager(trackAnalytics);

    const BTC = getCryptoCurrencyById("bitcoin");
    const ETH = getCryptoCurrencyById("ethereum");
    const a1 = genAccount("a1", { currency: BTC, operationsSize: 3 });
    const a2 = genAccount("a2", { currency: BTC, operationsSize: 5 });
    const a3 = genAccount("a3", { currency: ETH, operationsSize: 7 });
    const accounts = [a1, a2, a3];

    const nowSpy = jest
      .spyOn(Date, "now")
      // start time
      .mockReturnValueOnce(1_000)
      // end time (when last account completes)
      .mockReturnValueOnce(5_000);

    session.start(["a1", "a2", "a3"], "initial");

    // Completing accounts one by one should only trigger analytics on last one
    session.onAccountSyncDone("a1", accounts);
    expect(trackAnalytics).not.toHaveBeenCalled();

    session.onAccountSyncDone("a2", accounts);
    expect(trackAnalytics).not.toHaveBeenCalled();

    session.onAccountSyncDone("a3", accounts);

    expect(trackAnalytics).toHaveBeenCalledTimes(1);
    expect(trackAnalytics).toHaveBeenCalledWith(
      "SyncSuccessAllAccounts",
      expect.objectContaining({
        duration: 4, // (5000 - 1000) / 1000
        accountsCount: accounts.length,
        operationsCount: a1.operationsCount + a2.operationsCount + a3.operationsCount,
        chains: ["Bitcoin", "Ethereum"],
        reason: "initial",
      }),
    );

    nowSpy.mockRestore();
  });

  test("ignores subsequent 'initial' sessions after the first completion", () => {
    const trackAnalytics = jest.fn();
    const session = createSyncSessionManager(trackAnalytics);

    const BTC = getCryptoCurrencyById("bitcoin");
    const ETH = getCryptoCurrencyById("ethereum");
    const a1 = genAccount("a1", { currency: BTC });
    const a2 = genAccount("a2", { currency: ETH });
    a1.operationsCount = 2;
    a2.operationsCount = 1;
    const accounts = [a1, a2];

    const nowSpy = jest
      .spyOn(Date, "now")
      .mockReturnValueOnce(10_000) // first start
      .mockReturnValueOnce(14_000); // first completion

    // First initial session completes => tracked once
    session.start(["a1", "a2"], "initial");
    session.onAccountSyncDone("a1", accounts);
    session.onAccountSyncDone("a2", accounts);

    expect(trackAnalytics).toHaveBeenCalledTimes(1);
    expect(trackAnalytics.mock.calls[0][0]).toBe("SyncSuccessAllAccounts");

    // Next initial session should be ignored entirely
    session.start(["a1"], "initial");
    session.onAccountSyncDone("a1", accounts);

    expect(trackAnalytics).toHaveBeenCalledTimes(1);

    nowSpy.mockRestore();
  });

  test("does nothing if onAccountSyncDone is called without a started session", () => {
    const trackAnalytics = jest.fn();
    const session = createSyncSessionManager(trackAnalytics);
    const BTC = getCryptoCurrencyById("bitcoin");
    const acc = genAccount("x1", { currency: BTC });
    acc.operationsCount = 1;
    const accounts = [acc];

    session.onAccountSyncDone("x1", accounts);
    expect(trackAnalytics).not.toHaveBeenCalled();
  });
  test("tracks SyncSuccessAllAccounts with correct aggregates when all accounts complete and errors", () => {
    const trackAnalytics = jest.fn();
    const session = createSyncSessionManager(trackAnalytics);

    const BTC = getCryptoCurrencyById("bitcoin");
    const ETH = getCryptoCurrencyById("ethereum");
    const a1 = genAccount("a1", { currency: BTC, operationsSize: 3 });
    const a2 = genAccount("a2", { currency: BTC, operationsSize: 5 });
    const a3 = genAccount("a3", { currency: ETH, operationsSize: 7 });
    const accounts = [a1, a2, a3];

    const nowSpy = jest
      .spyOn(Date, "now")
      // start time
      .mockReturnValueOnce(1_000)
      // end time (when last account completes)
      .mockReturnValueOnce(5_000);

    session.start(["a1", "a2", "a3"], "initial");

    // Completing accounts one by one should only trigger analytics on last one
    session.onAccountSyncDone("a1", accounts);
    expect(trackAnalytics).not.toHaveBeenCalled();

    session.onAccountSyncDone("a2", accounts, true);
    expect(trackAnalytics).not.toHaveBeenCalled();

    session.onAccountSyncDone("a3", accounts, true);

    expect(trackAnalytics).toHaveBeenCalledTimes(1);
    expect(trackAnalytics).toHaveBeenCalledWith(
      "SyncSuccessAllAccounts",
      expect.objectContaining({
        duration: 4, // (5000 - 1000) / 1000
        accountsCount: accounts.length,
        operationsCount: a1.operationsCount + a2.operationsCount + a3.operationsCount,
        chains: ["Bitcoin", "Ethereum"],
        reason: "initial",
        syncWithErrors: 2,
      }),
    );

    nowSpy.mockRestore();
  });
});
