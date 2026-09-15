import { getBlock as getBlockFromNetwork } from "../../network";
import { createMockVechainContext, mockVechainConfig } from "../../test/context";
import { NATIVE_ASSET } from "../account/getBalance";
import { getBlock } from "./getBlock";

jest.mock("../../network", () => ({ getBlock: jest.fn() }));

const context = createMockVechainContext();

const VTHO_ADDRESS = "0x0000000000000000000000000000456e65726779";
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

// Verbatim from mainnet block 16407374, tx
// 0x5fdd7191c4d476a8e86060d516366e87421f65667b9b3c14c33a740c04921b10: a 10 VTHO transfer, which
// Thor reports as an event on the VTHO contract with an empty `transfers` array.
const VTHO_TRANSFER_EVENT = {
  address: VTHO_ADDRESS,
  topics: [
    TRANSFER_TOPIC,
    "0x000000000000000000000000cf130b42ae31c4931298b4b1c0f1d974b8732957",
    "0x0000000000000000000000000fe6688548f0c303932bb197b0a96034f1d74dba",
  ],
  data: "0x0000000000000000000000000000000000000000000000008ac7230489e80000",
};

const VTHO_SENDER = "0xcf130b42ae31c4931298b4b1c0f1d974b8732957";
const VTHO_RECIPIENT = "0x0fe6688548f0c303932bb197b0a96034f1d74dba";
const VTHO_AMOUNT = BigInt("10000000000000000000");

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

    const block = await getBlock(context, 10);

    expect(getBlockFromNetwork).toHaveBeenCalledTimes(1);
    expect(getBlockFromNetwork).toHaveBeenCalledWith(mockVechainConfig, 10, true);
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
            address: "0xsender",
            peer: "0xrecipient",
            asset: { type: "native", name: "VET" },
            amount: -BigInt("0x64"),
          },
          {
            type: "transfer",
            address: "0xrecipient",
            peer: "0xsender",
            asset: { type: "native", name: "VET" },
            amount: BigInt("0x64"),
          },
        ],
      },
    ]);
  });

  it("maps a VTHO (VIP-180) transfer event to token transfer operations", async () => {
    jest.mocked(getBlockFromNetwork).mockResolvedValueOnce({
      id: "0xabc",
      number: 16407374,
      timestamp: 1_694_598_050,
      transactions: [
        {
          id: "0x5fdd7191c4d476a8e86060d516366e87421f65667b9b3c14c33a740c04921b10",
          origin: VTHO_SENDER,
          gasUsed: 36518,
          paid: "0x51161467313c000",
          reverted: false,
          outputs: [{ contractAddress: null, events: [VTHO_TRANSFER_EVENT], transfers: [] }],
        },
      ],
    });

    const block = await getBlock(context, 16407374);

    const asset = { type: "token", assetReference: VTHO_ADDRESS, name: "VTHO" };
    expect(block.transactions[0].operations).toEqual([
      {
        type: "transfer",
        address: VTHO_SENDER,
        peer: VTHO_RECIPIENT,
        asset,
        amount: -VTHO_AMOUNT,
      },
      {
        type: "transfer",
        address: VTHO_RECIPIENT,
        peer: VTHO_SENDER,
        asset,
        amount: VTHO_AMOUNT,
      },
    ]);
  });

  it("ignores VIP-180 transfer events emitted by a contract other than VTHO", async () => {
    jest.mocked(getBlockFromNetwork).mockResolvedValueOnce({
      id: "0xabc",
      number: 10,
      timestamp: 1_700_000_000,
      transactions: [
        {
          id: "0xtx4",
          origin: "0xsender",
          gasUsed: 36518,
          paid: "0x100",
          reverted: false,
          outputs: [
            {
              contractAddress: null,
              events: [
                { ...VTHO_TRANSFER_EVENT, address: "0x5db3c8a942333f6468176a870db36eef120a34dc" },
              ],
              transfers: [],
            },
          ],
        },
      ],
    });

    const block = await getBlock(context, 10);

    expect(block.transactions[0].operations).toEqual([]);
  });

  it("ignores non-transfer events emitted by the VTHO contract", async () => {
    jest.mocked(getBlockFromNetwork).mockResolvedValueOnce({
      id: "0xabc",
      number: 10,
      timestamp: 1_700_000_000,
      transactions: [
        {
          id: "0xtx5",
          origin: "0xsender",
          gasUsed: 36518,
          paid: "0x100",
          reverted: false,
          outputs: [
            {
              contractAddress: null,
              events: [
                {
                  address: VTHO_ADDRESS,
                  // Approval(address,address,uint256)
                  topics: [
                    "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
                    VTHO_TRANSFER_EVENT.topics[1],
                    VTHO_TRANSFER_EVENT.topics[2],
                  ],
                  data: VTHO_TRANSFER_EVENT.data,
                },
              ],
              transfers: [],
            },
          ],
        },
      ],
    });

    const block = await getBlock(context, 10);

    expect(block.transactions[0].operations).toEqual([]);
  });

  it("gives every operation its own asset object", async () => {
    jest.mocked(getBlockFromNetwork).mockResolvedValueOnce({
      id: "0xabc",
      number: 10,
      timestamp: 1_700_000_000,
      transactions: [
        {
          id: "0xtx6",
          origin: "0xsender",
          gasUsed: 36518,
          paid: "0x100",
          reverted: false,
          outputs: [
            {
              contractAddress: null,
              events: [VTHO_TRANSFER_EVENT],
              transfers: [{ sender: "0xsender", recipient: "0xrecipient", amount: "0x64" }],
            },
          ],
        },
      ],
    });

    const block = await getBlock(context, 10);
    const assets = block.transactions[0].operations.map(op => op.asset);

    // Assets are copied per operation, so a consumer completing one in place (e.g. setting
    // `assetOwner`) cannot corrupt the others, nor the module-level constants they came from.
    expect(assets).toHaveLength(4);
    for (const [i, asset] of assets.entries()) {
      for (const other of assets.slice(i + 1)) {
        expect(asset).not.toBe(other);
      }
    }
    expect(assets[0]).not.toBe(NATIVE_ASSET);
    expect(assets[0]).toEqual(NATIVE_ASSET);
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

    const block = await getBlock(context, 10);

    expect(block.transactions[0].failed).toBe(true);
    expect(block.transactions[0].operations).toEqual([]);
  });

  it("throws when there is no block at the given height", async () => {
    jest.mocked(getBlockFromNetwork).mockResolvedValueOnce(null);

    await expect(getBlock(context, 1)).rejects.toThrow("vechain: no block at height 1");
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

    const block = await getBlock(context, 10);

    expect(block.transactions[0].feesPayer).toBe("0xdelegate");
  });
});
