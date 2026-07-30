import { getBlock as getBlockFromNetwork } from "../../network";
import { getBlock } from "./getBlock";

jest.mock("../../network", () => ({ getBlock: jest.fn() }));

describe("getBlock", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("maps VET transfers within an expanded block to transfer operations", async () => {
    jest.mocked(getBlockFromNetwork).mockResolvedValueOnce({
      id: "0xabc",
      number: 10,
      timestamp: 1_700_000_000,
      transactions: [
        {
          id: "0xtx1",
          origin: "0xsender",
          gasUsed: 21000,
          paid: "0x100",
          reverted: false,
          outputs: [
            {
              contractAddress: null,
              events: [],
              transfers: [{ sender: "0xsender", recipient: "0xrecipient", amount: "0x64" }],
            },
          ],
        },
      ],
    });

    const block = await getBlock(10);

    expect(getBlockFromNetwork).toHaveBeenCalledTimes(1);
    expect(getBlockFromNetwork).toHaveBeenCalledWith(10, true);
    expect(block.info).toEqual({
      height: 10,
      hash: "0xabc",
      time: new Date(1_700_000_000 * 1000),
    });
    expect(block.transactions).toEqual([
      {
        hash: "0xtx1",
        failed: false,
        fees: BigInt("0x100"),
        feesPayer: "0xsender",
        operations: [
          {
            type: "transfer",
            address: "0xrecipient",
            peer: "0xsender",
            asset: { type: "native" },
            amount: BigInt("0x64"),
          },
        ],
      },
    ]);
  });

  it("marks a reverted transaction as failed", async () => {
    jest.mocked(getBlockFromNetwork).mockResolvedValueOnce({
      id: "0xabc",
      number: 10,
      timestamp: 1_700_000_000,
      transactions: [
        { id: "0xtx2", origin: "0xsender", gasUsed: 0, paid: "0x0", reverted: true, outputs: [] },
      ],
    });

    const block = await getBlock(10);

    expect(block.transactions[0].failed).toBe(true);
    expect(block.transactions[0].operations).toEqual([]);
  });

  it("throws when there is no block at the given height", async () => {
    jest.mocked(getBlockFromNetwork).mockResolvedValueOnce(null);

    await expect(getBlock(1)).rejects.toThrow("vechain: no block at height 1");
  });

  it("uses the VIP-191 gasPayer as feesPayer when a tx is fee-delegated", async () => {
    jest.mocked(getBlockFromNetwork).mockResolvedValueOnce({
      id: "0xabc",
      number: 10,
      timestamp: 1_700_000_000,
      transactions: [
        {
          id: "0xtx3",
          origin: "0xsender",
          gasPayer: "0xdelegate",
          gasUsed: 21000,
          paid: "0x100",
          reverted: false,
          outputs: [],
        },
      ],
    });

    const block = await getBlock(10);

    expect(block.transactions[0].feesPayer).toBe("0xdelegate");
  });
});
