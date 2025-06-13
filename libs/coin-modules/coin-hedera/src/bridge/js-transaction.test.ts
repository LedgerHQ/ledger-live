import BigNumber from "bignumber.js";
import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { createBridges } from ".";
import { getMockedAccount } from "../test/fixtures/account";
import { getMockedTransaction } from "../test/fixtures/transaction";
import type { Transaction } from "../types";

describe("js-transaction", () => {
  let bridge: ReturnType<typeof createBridges>;
  const mockedAccount = getMockedAccount();
  const mockedTransaction = getMockedTransaction();

  beforeAll(() => {
    const signer = jest.fn();
    bridge = createBridges(signer);
  });

  test("createTransaction", () => {
    const data = mockedTransaction;
    const result = bridge.accountBridge.createTransaction(mockedAccount);

    expect(result).toEqual(data);
  });

  test("updateTransaction", () => {
    const patch: Partial<Transaction> = {
      amount: new BigNumber(5),
      recipient: "0.0.3",
      useAllAmount: true,
    };
    const data = { ...mockedTransaction, ...patch };
    const result = updateTransaction(mockedTransaction, patch);

    expect(result).toEqual(data);
  });

  test("prepareTransaction", async () => {
    const data = mockedTransaction;
    const result = await bridge.accountBridge.prepareTransaction(mockedAccount, mockedTransaction);

    expect(result).toEqual(data);
  });
});
