import { fetchBaseFee, broadcastTransaction, getLastBlock } from "../network";
import { broadcast } from "./broadcast";
import { estimateFees } from "./estimateFees";
import { lastBlock } from "./lastBlock";

jest.mock("../network", () => ({
  fetchBaseFee: jest.fn(),
  broadcastTransaction: jest.fn(),
  getLastBlock: jest.fn(),
}));

describe("network wrapper helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("broadcast delegates to broadcastTransaction", async () => {
    (broadcastTransaction as jest.Mock).mockResolvedValue("tx-hash");

    await expect(broadcast("signed-xdr")).resolves.toBe("tx-hash");
    expect(broadcastTransaction).toHaveBeenCalledWith("signed-xdr");
  });

  it("estimateFees converts recommended fee to bigint", async () => {
    (fetchBaseFee as jest.Mock).mockResolvedValue({ recommendedFee: 100, baseFee: 100 });

    await expect(estimateFees()).resolves.toBe(100n);
    expect(fetchBaseFee).toHaveBeenCalledTimes(1);
  });

  it("lastBlock delegates to getLastBlock", async () => {
    const block = {
      height: 123,
      hash: "block-hash",
      time: new Date("2026-01-01T00:00:00.000Z"),
    };
    (getLastBlock as jest.Mock).mockResolvedValue(block);

    await expect(lastBlock()).resolves.toEqual(block);
    expect(getLastBlock).toHaveBeenCalledTimes(1);
  });
});
