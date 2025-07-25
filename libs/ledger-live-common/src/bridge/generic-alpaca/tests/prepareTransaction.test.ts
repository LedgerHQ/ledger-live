import { genericPrepareTransaction } from "../prepareTransaction";
import { getAlpacaApi } from "../alpaca";
import { transactionToIntent } from "../utils";
import BigNumber from "bignumber.js";
import type { TransactionCommon } from "@ledgerhq/types-live";

jest.mock("../alpaca", () => ({
  getAlpacaApi: jest.fn(),
}));

jest.mock("../utils", () => ({
  transactionToIntent: jest.fn(),
}));

describe("genericPrepareTransaction", () => {
  const network = "testnet";
  const kind = "local";

  const account = {
    id: "test-account",
    address: "0xabc",
  } as any;

  const baseTransaction: TransactionCommon & { fees: BigNumber } = {
    amount: new BigNumber(100_000),
    fees: new BigNumber(500),
    recipient: "0xrecipient",
  };

  const txIntent = { mock: "intent" };

  beforeEach(() => {
    jest.clearAllMocks();
    (transactionToIntent as jest.Mock).mockReturnValue(txIntent);
  });

  it("updates fees if they differ", async () => {
    const newFee = new BigNumber(700);

    (getAlpacaApi as jest.Mock).mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({ value: newFee }),
    });

    const prepareTransaction = genericPrepareTransaction(network, kind);
    const result = await prepareTransaction(account, { ...baseTransaction });

    expect((result as any).fees.toString()).toBe(newFee.toString());
    expect(transactionToIntent).toHaveBeenCalledWith(
      account,
      expect.objectContaining(baseTransaction),
    );
  });

  it("returns original transaction if fees are the same", async () => {
    const sameFee = baseTransaction.fees;

    (getAlpacaApi as jest.Mock).mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({ value: sameFee }),
    });

    const prepareTransaction = genericPrepareTransaction(network, kind);
    const result = await prepareTransaction(account, baseTransaction);

    expect(result).toBe(baseTransaction);
  });

  it("sets fee if original fees are undefined", async () => {
    const newFee = new BigNumber(1234);
    (getAlpacaApi as jest.Mock).mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({ value: newFee }),
    });

    const txWithoutFees = { ...baseTransaction, fees: undefined as any };
    const prepareTransaction = genericPrepareTransaction(network, kind);
    const result = await prepareTransaction(account, txWithoutFees);

    expect((result as any).fees.toString()).toBe(newFee.toString());
    expect(result).not.toBe(txWithoutFees);
  });

  it("returns original if fees are BigNumber-equal but different instance", async () => {
    const sameValue = new BigNumber(baseTransaction.fees.toString()); // different instance
    (getAlpacaApi as jest.Mock).mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({ value: sameValue }),
    });

    const prepareTransaction = genericPrepareTransaction(network, kind);
    const result = await prepareTransaction(account, baseTransaction);

    expect(result).toBe(baseTransaction); // still same reference
  });
});
