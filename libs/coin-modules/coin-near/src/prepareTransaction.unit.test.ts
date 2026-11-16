import BigNumber from "bignumber.js";
import { createTransaction } from "./createTransaction";
import { getGasPrice } from "./network/node";
import { getCurrentNearPreloadData, setNearPreloadData } from "./preload-data";
import { prepareTransaction } from "./prepareTransaction";
import type { NearAccount, Transaction } from "./types";

jest.mock("./config", () => ({ getCoinConfig: () => ({}) }));
jest.mock("./network/node", () => ({ getGasPrice: jest.fn() }));

const GAS_PRICE = 100_000_000;
const NAMED_TRANSFER_FEES = new BigNumber(330).times(GAS_PRICE);
const SPENDABLE = new BigNumber("1000000000000");
const initialData = getCurrentNearPreloadData();

const account = {
  type: "Account",
  spendableBalance: SPENDABLE,
  pendingOperations: [],
} as unknown as NearAccount;

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  ...createTransaction(account),
  mode: "send",
  recipient: "recipient.near",
  amount: new BigNumber(500),
  ...overrides,
});

describe("prepareTransaction", () => {
  beforeEach(() => {
    jest.mocked(getGasPrice).mockResolvedValue(String(GAS_PRICE));
    setNearPreloadData({
      ...initialData,
      gasPrice: new BigNumber(GAS_PRICE),
      transferCostSend: new BigNumber(100),
      receiptCreationSend: new BigNumber(10),
      transferCostExecution: new BigNumber(200),
      receiptCreationExecution: new BigNumber(20),
    });
  });

  afterEach(() => {
    setNearPreloadData(initialData);
  });

  it("sets the estimated fee and keeps the amount when not sending everything", async () => {
    const result = await prepareTransaction(account, makeTransaction());

    expect(result.fees).toEqual(NAMED_TRANSFER_FEES);
    expect(result.amount).toEqual(new BigNumber(500));
  });

  it("sets the amount to the max spendable when sending everything", async () => {
    const result = await prepareTransaction(account, makeTransaction({ useAllAmount: true }));

    expect(result.amount).toEqual(SPENDABLE.minus(NAMED_TRANSFER_FEES));
  });

  it("returns the same transaction reference when nothing changed", async () => {
    const prepared = await prepareTransaction(account, makeTransaction());

    const result = await prepareTransaction(account, prepared);

    expect(result).toBe(prepared);
  });
});
