import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import type { PolkadotCoinConfig } from "../config";
import type { SidecarBlock, SidecarEvent, SidecarExtrinsic } from "../network/types";
import { polkadotMainnetConfigValue } from "../test/config.fixture";
import { getBlock } from "./getBlock";

const SIDECAR_URL = "https://polkadot.sidecar.test";
const config: PolkadotCoinConfig = { ...polkadotMainnetConfigValue, sidecar: { url: SIDECAR_URL } };

const ALICE = "12burmzVh1dCeZ9KRUV6Pmtabg9MNBNkCh9K7pbzV8dV7xrf";
const BOB = "16QX2GpD4o5FE1bTobpPq7qJYER6rosUbo732jLQtFxfZwAQ";
const CAROL = "14QKFrBmnhP5xoH1t7nC2q7mssgj671AhzThsGewVj3Ea8Xt";
const FEE_COLLECTOR = "13UVJyLkAxdQn6zM3Gz49SmCLi8SZW3bdtm7DTY29ScavqW2";
const NATIVE = { type: "native" };

const event = (pallet: string, method: string, data: unknown[]): SidecarEvent => ({
  method: { pallet, method },
  data,
});

const feeEvents = (payer: string, fee: string): SidecarEvent[] => [
  event("balances", "Withdraw", [payer, fee]),
  event("balances", "Deposit", [FEE_COLLECTOR, fee]),
  event("transactionPayment", "TransactionFeePaid", [payer, fee, "0"]),
];

const extrinsic = (overrides: Partial<SidecarExtrinsic>): SidecarExtrinsic => ({
  method: { pallet: "balances", method: "transferKeepAlive" },
  signature: { signature: "0x700a", signer: { id: ALICE } },
  nonce: "0",
  args: {},
  tip: "0",
  hash: "0x36e4",
  era: { immortalEra: "0x00" },
  events: [],
  success: true,
  paysFee: true,
  ...overrides,
});

const inherent = (pallet: string, method: string, args: SidecarExtrinsic["args"] = {}) =>
  extrinsic({
    method: { pallet, method },
    signature: null,
    nonce: null,
    tip: null,
    args,
    hash: `0x${pallet}`,
    events: [event("system", "ExtrinsicSuccess", [{ paysFee: "Yes" }])],
    paysFee: false,
  });

const block = (overrides: Partial<SidecarBlock> = {}): SidecarBlock => ({
  number: "22653132",
  hash: "0xdfb85c23d2f195e70e87418cb8d3889b1a5a7cb22d46447b6c5d40b9b7eae1fc",
  parentHash: "0xcfd1fab61599d8545e3f74f127fcd05ebfba9ec374ddf6bb227ae8b123d06ec1",
  stateRoot: "0xd589",
  extrinsicsRoot: "0xcbf1",
  authorId: "134BxqvdkMzf1v95j1Wr2NmXoqpys2Y96GXG5a5H3YtMKLqf",
  logs: [],
  extrinsics: [
    inherent("parachainSystem", "setValidationData"),
    inherent("timestamp", "set", { now: "1793704368000" }),
  ],
  onFinalize: { events: [] },
  finalized: true,
  ...overrides,
});

describe("getBlock", () => {
  const mockServer = setupServer();
  const blockEndpoint = jest.fn<SidecarBlock | { error: string }, [string]>();

  beforeAll(() => mockServer.listen({ onUnhandledRequest: "error" }));
  beforeEach(() => {
    blockEndpoint.mockReset();
    mockServer.use(
      http.get(`${SIDECAR_URL}/blocks/:blockId`, ({ params }) => {
        const body = blockEndpoint(String(params.blockId));
        return HttpResponse.json(body, { status: "error" in body ? 400 : 200 });
      }),
    );
  });
  afterEach(() => mockServer.resetHandlers());
  afterAll(() => mockServer.close());

  it("requests the block at the given height", async () => {
    blockEndpoint.mockReturnValue(block());

    await getBlock(config, 22653132);

    expect(blockEndpoint).toHaveBeenCalledWith("22653132");
  });

  it("returns the block info, with its timestamp and parent", async () => {
    blockEndpoint.mockReturnValue(block());

    const { info } = await getBlock(config, 22653132);

    expect(info).toEqual({
      height: 22653132,
      hash: "0xdfb85c23d2f195e70e87418cb8d3889b1a5a7cb22d46447b6c5d40b9b7eae1fc",
      time: new Date(1793704368000),
      parent: {
        height: 22653131,
        hash: "0xcfd1fab61599d8545e3f74f127fcd05ebfba9ec374ddf6bb227ae8b123d06ec1",
      },
    });
  });

  it("rejects the genesis block, which has no timestamp", async () => {
    blockEndpoint.mockReturnValue(block({ number: "0", extrinsics: [] }));

    await expect(getBlock(config, 0)).rejects.toThrow("Polkadot block 0 has no timestamp");
  });

  it("leaves inherents out of the transactions", async () => {
    blockEndpoint.mockReturnValue(block());

    const { transactions } = await getBlock(config, 22653132);

    expect(transactions).toEqual([]);
  });

  it("maps a transfer to a debit of the sender and a credit of the recipient", async () => {
    blockEndpoint.mockReturnValue(
      block({
        extrinsics: [
          ...block().extrinsics,
          extrinsic({
            hash: "0x36e4a2ce",
            events: [
              ...feeEvents(ALICE, "8808355"),
              event("balances", "Transfer", [ALICE, BOB, "10000000"]),
              event("system", "ExtrinsicSuccess", [{ paysFee: "Yes" }]),
            ],
          }),
        ],
      }),
    );

    const { transactions } = await getBlock(config, 22653132);

    expect(transactions).toEqual([
      {
        hash: "0x36e4a2ce",
        failed: false,
        operations: [
          { type: "transfer", address: ALICE, peer: BOB, asset: NATIVE, amount: -10000000n },
          { type: "transfer", address: BOB, peer: ALICE, asset: NATIVE, amount: 10000000n },
        ],
        fees: 8808355n,
        feesPayer: ALICE,
        details: { palletMethod: "balances.transferKeepAlive" },
      },
    ]);
  });

  it("maps every transfer of a batch", async () => {
    blockEndpoint.mockReturnValue(
      block({
        extrinsics: [
          extrinsic({
            method: { pallet: "utility", method: "batchAll" },
            events: [
              ...feeEvents(ALICE, "1"),
              event("balances", "Transfer", [ALICE, BOB, "2"]),
              event("balances", "Transfer", [ALICE, CAROL, "3"]),
            ],
          }),
          inherent("timestamp", "set", { now: "1793704368000" }),
        ],
      }),
    );

    const [transaction] = (await getBlock(config, 22653132)).transactions;

    expect(transaction.operations).toEqual([
      { type: "transfer", address: ALICE, peer: BOB, asset: NATIVE, amount: -2n },
      { type: "transfer", address: BOB, peer: ALICE, asset: NATIVE, amount: 2n },
      { type: "transfer", address: ALICE, peer: CAROL, asset: NATIVE, amount: -3n },
      { type: "transfer", address: CAROL, peer: ALICE, asset: NATIVE, amount: 3n },
    ]);
    expect(transaction.details).toEqual({ palletMethod: "utility.batchAll" });
  });

  it("keeps the fees of a failed extrinsic and drops its operations", async () => {
    blockEndpoint.mockReturnValue(
      block({
        extrinsics: [
          ...block().extrinsics,
          extrinsic({
            success: false,
            events: [
              ...feeEvents(ALICE, "8808355"),
              event("balances", "Transfer", [ALICE, BOB, "10000000"]),
              event("system", "ExtrinsicFailed", [{ module: { index: "10", error: "0x02" } }]),
            ],
          }),
        ],
      }),
    );

    const [transaction] = (await getBlock(config, 22653132)).transactions;

    expect(transaction).toMatchObject({ failed: true, operations: [], fees: 8808355n });
  });

  it("charges no fees to the signer of an extrinsic that pays none", async () => {
    blockEndpoint.mockReturnValue(
      block({
        extrinsics: [...block().extrinsics, extrinsic({ paysFee: false, events: [] })],
      }),
    );

    const [transaction] = (await getBlock(config, 22653132)).transactions;

    expect(transaction).toMatchObject({ fees: 0n, feesPayer: ALICE });
  });

  it("still charges the tip of an extrinsic that pays no fee", async () => {
    blockEndpoint.mockReturnValue(
      block({
        extrinsics: [...block().extrinsics, extrinsic({ paysFee: false, tip: "7", events: [] })],
      }),
    );

    const [transaction] = (await getBlock(config, 22653132)).transactions;

    expect(transaction).toMatchObject({ fees: 7n, feesPayer: ALICE });
  });

  it("falls back on the estimated fee plus the tip when the runtime emits no fee event", async () => {
    blockEndpoint.mockReturnValue(
      block({
        extrinsics: [
          ...block().extrinsics,
          extrinsic({ tip: "5", info: { partialFee: "159000011" } }),
        ],
      }),
    );

    const [transaction] = (await getBlock(config, 10000006)).transactions;

    expect(transaction).toMatchObject({ fees: 159000016n, feesPayer: ALICE });
  });

  it("rejects an extrinsic that pays fees but reports none", async () => {
    blockEndpoint.mockReturnValue(
      block({ extrinsics: [...block().extrinsics, extrinsic({ hash: "0x36e4" })] }),
    );

    await expect(getBlock(config, 22653132)).rejects.toThrow(
      "Polkadot extrinsic 0x36e4 pays fees but reports none",
    );
  });

  it("rejects an extrinsic whose fee estimate the sidecar could not compute", async () => {
    blockEndpoint.mockReturnValue(
      block({
        extrinsics: [
          ...block().extrinsics,
          extrinsic({ hash: "0x36e4", info: { error: "Fee calculation not supported for 1" } }),
        ],
      }),
    );

    await expect(getBlock(config, 22653132)).rejects.toThrow(
      "Polkadot extrinsic 0x36e4 pays fees but reports none",
    );
  });

  it("rejects an extrinsic that omits whether it pays fees", async () => {
    const { paysFee: _paysFee, ...withoutPaysFee } = extrinsic({ hash: "0x36e4", tip: "7" });
    blockEndpoint.mockReturnValue(block({ extrinsics: [...block().extrinsics, withoutPaysFee] }));

    await expect(getBlock(config, 22653132)).rejects.toThrow(
      "Polkadot extrinsic 0x36e4 does not say whether it pays fees",
    );
  });

  it("rejects an extrinsic that does not say whether it pays fees", async () => {
    blockEndpoint.mockReturnValue(
      block({
        extrinsics: [...block().extrinsics, extrinsic({ hash: "0x36e4", paysFee: null, tip: "7" })],
      }),
    );

    await expect(getBlock(config, 22653132)).rejects.toThrow(
      "Polkadot extrinsic 0x36e4 does not say whether it pays fees",
    );
  });

  it("charges the fees to the account the fee event names", async () => {
    blockEndpoint.mockReturnValue(
      block({
        extrinsics: [
          ...block().extrinsics,
          extrinsic({
            method: { pallet: "proxy", method: "proxy" },
            events: feeEvents(CAROL, "11511364"),
          }),
        ],
      }),
    );

    const [transaction] = (await getBlock(config, 22653132)).transactions;

    expect(transaction).toMatchObject({ fees: 11511364n, feesPayer: CAROL });
  });

  it("rejects a block without a timestamp", async () => {
    blockEndpoint.mockReturnValue(
      block({ number: "1", extrinsics: [inherent("parachainSystem", "setValidationData")] }),
    );

    await expect(getBlock(config, 1)).rejects.toThrow("Polkadot block 1 has no timestamp");
  });

  it("reports fees paid in another asset apart from the native fees", async () => {
    const usdt = {
      parents: "0",
      interior: { x2: [{ palletInstance: "50" }, { generalIndex: "1984" }] },
    };
    blockEndpoint.mockReturnValue(
      block({
        extrinsics: [
          ...block().extrinsics,
          extrinsic({
            info: { partialFee: "159000011" },
            events: [
              event("assetConversionTxPayment", "AssetTxFeePaid", [CAROL, "3071", "0", usdt]),
            ],
          }),
        ],
      }),
    );

    const [transaction] = (await getBlock(config, 22653132)).transactions;

    expect(transaction).toMatchObject({
      fees: 0n,
      feesPayer: CAROL,
      details: { assetFees: { asset: usdt, amount: 3071n } },
    });
  });

  it("charges the native balance when the fees are paid in the native asset", async () => {
    const dot = { parents: "1", interior: { here: null } };
    blockEndpoint.mockReturnValue(
      block({
        extrinsics: [
          ...block().extrinsics,
          extrinsic({
            events: [
              event("assetConversionTxPayment", "AssetTxFeePaid", [CAROL, "8808355", "10", dot]),
            ],
          }),
        ],
      }),
    );

    const [transaction] = (await getBlock(config, 22653132)).transactions;

    expect(transaction).toMatchObject({ fees: 8808355n, feesPayer: CAROL });
    expect(transaction.details).toEqual({ palletMethod: "balances.transferKeepAlive" });
  });

  it("rejects fees paid in an asset it cannot read", async () => {
    blockEndpoint.mockReturnValue(
      block({
        extrinsics: [
          ...block().extrinsics,
          extrinsic({
            hash: "0x36e4",
            events: [event("assetTxPayment", "AssetTxFeePaid", [CAROL, "3071", "0", "1984"])],
          }),
        ],
      }),
    );

    await expect(getBlock(config, 22653132)).rejects.toThrow(
      'Unexpected asset of the fees of extrinsic 0x36e4: "1984"',
    );
  });

  it("rejects a block with an extrinsic it cannot decode", async () => {
    const { method: _method, args: _args, ...undecodable } = extrinsic({ signature: null });
    blockEndpoint.mockReturnValue(
      block({
        partial: true,
        extrinsics: [...block().extrinsics, { ...undecodable, decodeError: "Unable to decode" }],
      }),
    );

    await expect(getBlock(config, 22653132)).rejects.toThrow(
      "Polkadot block 22653132 has extrinsics that cannot be decoded",
    );
  });

  it("rejects a block flagged as partial", async () => {
    blockEndpoint.mockReturnValue(block({ partial: true }));

    await expect(getBlock(config, 22653132)).rejects.toThrow(
      "Polkadot block 22653132 has extrinsics that cannot be decoded",
    );
  });

  it("rejects a transfer event it cannot read", async () => {
    blockEndpoint.mockReturnValue(
      block({
        extrinsics: [
          ...block().extrinsics,
          extrinsic({
            events: [...feeEvents(ALICE, "1"), event("balances", "Transfer", [ALICE, BOB])],
          }),
        ],
      }),
    );

    await expect(getBlock(config, 22653132)).rejects.toThrow(
      "Unexpected balances.Transfer event data",
    );
  });

  it("rejects a block the sidecar does not find", async () => {
    blockEndpoint.mockReturnValue({
      error: "Block not found: Block at height 999999999 not found",
    });

    await expect(getBlock(config, 999999999)).rejects.toThrow(
      "Block at height 999999999 not found",
    );
  });
});
