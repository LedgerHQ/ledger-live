import BigNumber from "bignumber.js";
import { fetchBalances, fetchEstimatedFees } from "../network";
import {
  createMockAccount,
  createMockBalanceResponse,
  createMockEstimatedFeesResponse,
  createMockTokenAccount,
  createMockTransaction,
} from "../test/fixtures";
import { estimateMaxSpendable } from "./estimateMaxSpendable";

jest.mock("../network/api");

const F1_ADDRESS = "f1plmg3kklvmnodfboimcq5w27mnfs2hwjtas6gia";
const F4_ADDRESS = "f410fncojwmrseefktoco6rcnb3zv2eiqfli7muhvqma";
const F0_ADDRESS = "f01840380";

const mockedFetchBalances = jest.mocked(fetchBalances);
const mockedFetchEstimatedFees = jest.mocked(fetchEstimatedFees);

const makeAccount = () =>
  createMockAccount({
    freshAddress: F1_ADDRESS,
    balance: new BigNumber(1_000_000),
    spendableBalance: new BigNumber(1_000_000),
  });

const makeTransaction = (overrides: Parameters<typeof createMockTransaction>[0] = {}) =>
  createMockTransaction({
    recipient: F1_ADDRESS,
    amount: new BigNumber(1),
    ...overrides,
  });

const makeTokenTransaction = () =>
  makeTransaction({ recipient: F0_ADDRESS, amount: new BigNumber(10) });

describe("estimateMaxSpendable (legacy bridge)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetchBalances.mockResolvedValue(
      createMockBalanceResponse({ spendable_balance: "1000000" }),
    );
    mockedFetchEstimatedFees.mockResolvedValue(
      createMockEstimatedFeesResponse({ gas_fee_cap: "1000", gas_limit: 10 }),
    );
  });

  it("returns the spendable balance minus the estimated fees for a native account", async () => {
    const result = await estimateMaxSpendable({
      account: makeAccount(),
      transaction: makeTransaction(),
    });

    expect(result).toEqual(new BigNumber(990000));
  });

  it("throws InvalidAddress when the recipient is invalid", async () => {
    await expect(
      estimateMaxSpendable({
        account: makeAccount(),
        transaction: makeTransaction({ recipient: "notavalidrecipient" }),
      }),
    ).rejects.toMatchObject({ name: "InvalidAddress" });
  });

  it("throws InvalidAddress when the sender is invalid", async () => {
    await expect(
      estimateMaxSpendable({
        account: createMockAccount({ freshAddress: "novalidaddress" }),
        transaction: makeTransaction(),
      }),
    ).rejects.toMatchObject({ name: "InvalidAddress" });
  });

  it("returns zero without estimating fees when the spendable balance is zero", async () => {
    mockedFetchBalances.mockResolvedValue(createMockBalanceResponse({ spendable_balance: "0" }));

    const result = await estimateMaxSpendable({
      account: makeAccount(),
      transaction: makeTransaction(),
    });

    expect(result).toEqual(new BigNumber(0));
    expect(mockedFetchEstimatedFees).not.toHaveBeenCalled();
  });

  it("throws NotEnoughSpendableBalance when the balance does not cover the fees", async () => {
    mockedFetchBalances.mockResolvedValue(createMockBalanceResponse({ spendable_balance: "5000" }));

    await expect(
      estimateMaxSpendable({ account: makeAccount(), transaction: makeTransaction() }),
    ).rejects.toMatchObject({ name: "NotEnoughSpendableBalance" });
  });

  describe("with a token account", () => {
    const parent = makeAccount();
    const baseTokenAccount = createMockTokenAccount(parent);
    const tokenAccount = {
      ...baseTokenAccount,
      id: "token-sub-account",
      parentId: parent.id,
      spendableBalance: new BigNumber(777),
      token: { ...baseTokenAccount.token, contractAddress: F4_ADDRESS },
    };
    it("throws NotEnoughBalanceInParentAccount when the parent balance does not cover the token fees", async () => {
      mockedFetchBalances.mockResolvedValue(
        createMockBalanceResponse({ spendable_balance: "5000" }),
      );

      await expect(
        estimateMaxSpendable({
          account: tokenAccount,
          parentAccount: parent,
          transaction: makeTokenTransaction(),
        }),
      ).rejects.toMatchObject({ name: "NotEnoughBalanceInParentAccount" });
    });

    it("returns the token spendable balance", async () => {
      const result = await estimateMaxSpendable({
        account: tokenAccount,
        parentAccount: parent,
        transaction: makeTokenTransaction(),
      });

      expect(result).toEqual(new BigNumber(777));
    });
  });
});
