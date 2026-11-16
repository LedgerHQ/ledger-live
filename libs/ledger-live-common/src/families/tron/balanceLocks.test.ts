import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
import { mockTronAccount } from "./accountData.mock";
import tronBalanceLocks from "./balanceLocks";

const amount = (value: number) => ({ amount: new BigNumber(value) });
const unfreezing = (value: number) => ({ ...amount(value), expireTime: new Date(0) });

describe("tronBalanceLocks", () => {
  it("sums own and delegated frozen TRX as frozen, unfreezing TRX as unbonding", () => {
    const account = mockTronAccount({
      frozen: { bandwidth: amount(1), energy: amount(2) },
      delegatedFrozen: { bandwidth: amount(4), energy: amount(8) },
      unFrozen: { bandwidth: [unfreezing(16), unfreezing(32)], energy: [unfreezing(64)] },
    });
    expect(tronBalanceLocks(account)).toEqual([
      { reason: "frozen", amount: "15" },
      { reason: "unbonding", amount: "112" },
    ]);
  });

  it("totals what the account page shows as frozen assets", () => {
    const account = mockTronAccount({
      frozen: { bandwidth: null, energy: amount(5) },
      unFrozen: { bandwidth: null, energy: [unfreezing(7)] },
    });
    const total = tronBalanceLocks(account).reduce((sum, lock) => sum + BigInt(lock.amount), 0n);
    expect(total).toBe(12n);
  });

  it("answers no lock when nothing is frozen", () => {
    expect(tronBalanceLocks(mockTronAccount())).toEqual([]);
  });

  it("answers no lock for an account without Tron resources", () => {
    expect(
      tronBalanceLocks(genAccount("eth", { currency: getCryptoCurrencyById("ethereum") })),
    ).toEqual([]);
  });
});
