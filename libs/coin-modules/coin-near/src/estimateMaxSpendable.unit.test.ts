import BigNumber from "bignumber.js";
import estimateMaxSpendable from "./estimateMaxSpendable";
import { getGasPrice } from "./network/node";
import { getCurrentNearPreloadData, setNearPreloadData } from "./preload-data";
import type { NearAccount, Transaction } from "./types";

jest.mock("./config", () => ({ getCoinConfig: () => ({}) }));
jest.mock("./network/node", () => ({ getGasPrice: jest.fn() }));

const GAS_PRICE = 100_000_000;
const NAMED_TRANSFER_GAS = 330;
const initialData = getCurrentNearPreloadData();

const makeAccount = (spendableBalance: BigNumber): NearAccount =>
  ({ type: "Account", spendableBalance, pendingOperations: [] }) as unknown as NearAccount;

const transaction = { mode: "send", recipient: "recipient.near" } as Transaction;

describe("estimateMaxSpendable", () => {
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

  it("returns the spendable balance minus the estimated fee", async () => {
    const spendable = new BigNumber("1000000000000");

    const result = await estimateMaxSpendable({ account: makeAccount(spendable), transaction });

    expect(result).toEqual(spendable.minus(new BigNumber(NAMED_TRANSFER_GAS).times(GAS_PRICE)));
  });

  it("floors the result at zero when the fee exceeds the spendable balance", async () => {
    const result = await estimateMaxSpendable({
      account: makeAccount(new BigNumber(1)),
      transaction,
    });

    expect(result).toEqual(new BigNumber(0));
  });
});
