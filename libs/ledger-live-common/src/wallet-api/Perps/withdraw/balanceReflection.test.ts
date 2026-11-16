import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import {
  getWithdrawTargetBalance,
  WITHDRAW_BALANCE_REFLECTION_POLL_MS,
  WITHDRAW_BALANCE_REFLECTION_TIMEOUT_MS,
  waitForWithdrawBalanceReflected,
} from "./balanceReflection";

const balanceBefore = new BigNumber(10_000_000);
const targetBalance = new BigNumber(7_000_000);

describe("getWithdrawTargetBalance", () => {
  it("is lower by the amount withdrawn, in the account unit", () => {
    const currency = getCryptoCurrencyById("hypercore");
    const account = genAccount("hypercore-1", { currency, operationsSize: 0 });
    const amount = new BigNumber("2.5").shiftedBy(currency.units[0].magnitude);

    expect(getWithdrawTargetBalance(account, balanceBefore, "2.5")).toEqual(
      balanceBefore.minus(amount),
    );
  });
});

describe("waitForWithdrawBalanceReflected", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("syncs the account until its balance drops to the target", async () => {
    let balance = balanceBefore;
    const syncAccount = jest.fn(() => {
      if (syncAccount.mock.calls.length === 3) balance = targetBalance;
    });

    const outcome = waitForWithdrawBalanceReflected({
      targetBalance,
      getBalance: () => balance,
      syncAccount,
    });
    await jest.advanceTimersByTimeAsync(WITHDRAW_BALANCE_REFLECTION_POLL_MS * 3);

    await expect(outcome).resolves.toBe("reflected");
    expect(syncAccount).toHaveBeenCalledTimes(3);
  });

  it("returns at once when the balance already shows the withdraw", async () => {
    const syncAccount = jest.fn();

    const outcome = waitForWithdrawBalanceReflected({
      targetBalance,
      getBalance: () => targetBalance,
      syncAccount,
    });

    await expect(outcome).resolves.toBe("reflected");
    expect(syncAccount).not.toHaveBeenCalled();
  });

  it("gives up after the timeout, as the withdraw went through anyway", async () => {
    const syncAccount = jest.fn();

    const outcome = waitForWithdrawBalanceReflected({
      targetBalance,
      getBalance: () => balanceBefore,
      syncAccount,
    });
    await jest.advanceTimersByTimeAsync(WITHDRAW_BALANCE_REFLECTION_TIMEOUT_MS);

    await expect(outcome).resolves.toBe("timeout");
    expect(syncAccount).toHaveBeenCalledTimes(
      WITHDRAW_BALANCE_REFLECTION_TIMEOUT_MS / WITHDRAW_BALANCE_REFLECTION_POLL_MS,
    );
  });

  it("stops syncing once the user left", async () => {
    let cancelled = false;
    const syncAccount = jest.fn(() => {
      cancelled = true;
    });

    const outcome = waitForWithdrawBalanceReflected({
      targetBalance,
      getBalance: () => balanceBefore,
      syncAccount,
      isCancelled: () => cancelled,
    });
    await jest.advanceTimersByTimeAsync(WITHDRAW_BALANCE_REFLECTION_POLL_MS * 3);

    await expect(outcome).resolves.toBe("cancelled");
    expect(syncAccount).toHaveBeenCalledTimes(1);
  });
});
