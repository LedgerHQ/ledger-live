import type { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getCalTokensCached } from "../network/gateway";
import {
  createMockCantonAccount,
  createMockCoinConfigValue,
  createMockContext,
  createMockTokenAccount,
  createMockTransaction,
} from "../test/fixtures";
import { Transaction } from "../types";
import { prepareTransaction } from "./prepareTransaction";

jest.mock("../network/gateway", () => ({
  ...jest.requireActual("../network/gateway"),
  getCalTokensCached: jest.fn(),
}));

const CC = new BigNumber(10).pow(38);

const contextWithFee = (fee: number) => createMockContext({ ...createMockCoinConfigValue(), fee });

const ccAccount = (spendableBalance: BigNumber, subAccounts: TokenAccount[] = []): Account =>
  createMockCantonAccount({ balance: spendableBalance, spendableBalance, subAccounts });

const sendMax = (overrides: Partial<Transaction> = {}): Transaction =>
  createMockTransaction({ amount: new BigNumber(0), fee: null, useAllAmount: true, ...overrides });

describe("prepareTransaction", () => {
  beforeEach(() => {
    jest.mocked(getCalTokensCached).mockResolvedValue(new Map([["canton_network/usdcx", "USDCx"]]));
  });

  it("should update fee field if it's different", async () => {
    const newTx = await prepareTransaction(
      contextWithFee(1),
      ccAccount(CC.times(10)),
      createMockTransaction({ fee: new BigNumber(0) }),
    );

    expect(newTx.fee).toEqual(CC);
  });

  it("should keep the entered amount when Send max is off", async () => {
    const amount = CC.times(3);

    const newTx = await prepareTransaction(
      contextWithFee(1),
      ccAccount(CC.times(9)),
      createMockTransaction({ amount, useAllAmount: false }),
    );

    expect(newTx.amount).toBe(amount);
  });

  describe("Send max", () => {
    it.each([0, 1])("should send the CC spendable balance minus a fee of %i CC", async fee => {
      const newTx = await prepareTransaction(
        contextWithFee(fee),
        ccAccount(CC.times(9)),
        sendMax(),
      );

      expect(newTx.amount).toEqual(CC.times(9 - fee));
      expect(newTx.fee).toEqual(CC.times(fee));
    });

    it("should send from the CC spendable balance, not the total balance", async () => {
      const account = createMockCantonAccount({
        balance: CC.times(10),
        spendableBalance: CC.times(9),
      });

      const newTx = await prepareTransaction(contextWithFee(1), account, sendMax());

      expect(newTx.amount).toEqual(CC.times(8));
    });

    it("should send nothing when the CC spendable balance does not cover the fee", async () => {
      const newTx = await prepareTransaction(contextWithFee(1), ccAccount(CC.div(2)), sendMax());

      expect(newTx.amount).toEqual(new BigNumber(0));
    });

    it("should send the whole token balance, without the CC fee", async () => {
      const tokenAccount = createMockTokenAccount({ spendableBalance: new BigNumber(500) });

      const newTx = await prepareTransaction(
        contextWithFee(1),
        ccAccount(CC.times(9), [tokenAccount]),
        sendMax({ subAccountId: tokenAccount.id }),
      );

      expect(newTx).toMatchObject({
        amount: new BigNumber(500),
        fee: CC,
        tokenId: "USDCx",
        instrumentAdmin: "issuer::1220",
      });
    });

    it("should send nothing, not the CC balance, when the token account is missing", async () => {
      const newTx = await prepareTransaction(
        contextWithFee(0),
        ccAccount(CC.times(9)),
        sendMax({ subAccountId: createMockTokenAccount().id }),
      );

      expect(newTx.amount).toEqual(new BigNumber(0));
    });

    it("should keep the transaction when nothing changed since the last prepare", async () => {
      const context = contextWithFee(1);
      const account = ccAccount(CC.times(9));

      const prepared = await prepareTransaction(context, account, sendMax());

      expect(await prepareTransaction(context, account, prepared)).toBe(prepared);
    });
  });
});
