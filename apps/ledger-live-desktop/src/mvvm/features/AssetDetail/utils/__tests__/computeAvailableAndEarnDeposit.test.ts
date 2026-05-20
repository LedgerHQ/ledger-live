import BigNumber from "bignumber.js";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { computeAvailableAndEarnDeposit } from "../computeAvailableAndEarnDeposit";

const btc = getCryptoCurrencyById("bitcoin");

describe("computeAvailableAndEarnDeposit", () => {
  it("returns zero deposit when spendable equals total balance", () => {
    const account = genAccount("compute-deposit-zero", { currency: btc });
    account.balance = new BigNumber(10);
    account.spendableBalance = new BigNumber(10);

    const { availableBalance, earnDeposit } = computeAvailableAndEarnDeposit([account]);

    expect(availableBalance.toNumber()).toBe(10);
    expect(earnDeposit.toNumber()).toBe(0);
  });

  it("aggregates earn deposit across multiple accounts", () => {
    const accountA = genAccount("compute-deposit-a", { currency: btc });
    accountA.balance = new BigNumber(10);
    accountA.spendableBalance = new BigNumber(4);
    const accountB = genAccount("compute-deposit-b", { currency: btc });
    accountB.balance = new BigNumber(6);
    accountB.spendableBalance = new BigNumber(6);

    const { earnDeposit } = computeAvailableAndEarnDeposit([accountA, accountB]);

    expect(earnDeposit.toNumber()).toBe(6);
  });

  it("clamps negative deposit to zero when spendable exceeds balance", () => {
    const account = genAccount("compute-deposit-negative", { currency: btc });
    account.balance = new BigNumber(4);
    account.spendableBalance = new BigNumber(10);

    const { earnDeposit } = computeAvailableAndEarnDeposit([account]);

    expect(earnDeposit.toNumber()).toBe(0);
  });
});
