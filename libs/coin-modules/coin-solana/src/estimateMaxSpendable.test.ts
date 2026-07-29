import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { estimateFeeAndSpendable } from "./estimateMaxSpendable";
import { ChainAPI } from "./network";

const mockEstimateTxFee = jest.fn();
jest.mock("./logic/estimateFees", () => ({
  ...jest.requireActual("./logic/estimateFees"),
  estimateTxFee: (...args: unknown[]) => mockEstimateTxFee(...args),
}));

const TX_FEE = 5000;

const account = (over: Partial<Account>): Account =>
  ({
    freshAddress: "addr",
    spendableBalance: new BigNumber(1_000_000),
    operations: [],
    pendingOperations: [],
    ...over,
  }) as unknown as Account;

const mockApi = (over: { balance?: number; rentExempt?: number }): ChainAPI =>
  ({
    getBalance: jest.fn().mockResolvedValue(over.balance ?? 0),
    getMinimumBalanceForRentExemption: jest.fn().mockResolvedValue(over.rentExempt ?? 0),
  }) as unknown as ChainAPI;

describe("estimateFeeAndSpendable - native spendable", () => {
  beforeEach(() => {
    mockEstimateTxFee.mockResolvedValue(TX_FEE);
  });

  it("returns the live on-chain balance minus the fee", async () => {
    const api = mockApi({ balance: 1_000_000 });
    const { fee, spendable } = await estimateFeeAndSpendable(api, account({}));
    expect(fee).toBe(TX_FEE);
    expect(spendable.toNumber()).toBe(1_000_000 - TX_FEE);
  });

  it("uses the freshly fetched on-chain balance, not the (possibly stale) synced spendableBalance", async () => {
    // Synced account still reports the old balance; on-chain balance already dropped
    // (e.g. right after a swap/send). We must trust the on-chain value.
    const api = mockApi({ balance: 700_000 });
    const { spendable } = await estimateFeeAndSpendable(
      api,
      account({ spendableBalance: new BigNumber(1_000_000) }),
    );
    expect(spendable.toNumber()).toBe(700_000 - TX_FEE);
  });

  it("relies on the live on-chain balance and does not subtract pending operations itself", async () => {
    // A pending swap/send is present, but max-spendable is derived solely from the
    // freshly fetched on-chain balance; pending operations are not subtracted on top of it.
    const api = mockApi({ balance: 970_996 });
    const { spendable } = await estimateFeeAndSpendable(
      api,
      account({
        spendableBalance: new BigNumber(1_000_000),
        pendingOperations: [
          {
            hash: "swap",
            type: "OUT",
            value: new BigNumber(29_004),
            fee: new BigNumber(0),
          },
        ],
      } as unknown as Partial<Account>),
    );
    expect(spendable.toNumber()).toBe(970_996 - TX_FEE);
  });

  it("subtracts the rent-exempt reservation", async () => {
    const api = mockApi({ balance: 1_000_000, rentExempt: 890_880 });
    const { spendable } = await estimateFeeAndSpendable(api, account({}));
    expect(spendable.toNumber()).toBe(1_000_000 - 890_880 - TX_FEE);
  });

  it("subtracts the unstake reserve", async () => {
    const api = mockApi({ balance: 1_000_000 });
    const { spendable } = await estimateFeeAndSpendable(
      api,
      account({
        solanaResources: { unstakeReserve: new BigNumber(100_000) },
      } as unknown as Partial<Account>),
    );
    expect(spendable.toNumber()).toBe(1_000_000 - 100_000 - TX_FEE);
  });

  it("never returns a negative spendable", async () => {
    const api = mockApi({ balance: 1000 });
    const { spendable } = await estimateFeeAndSpendable(api, account({}));
    expect(spendable.toNumber()).toBe(0);
  });
});
