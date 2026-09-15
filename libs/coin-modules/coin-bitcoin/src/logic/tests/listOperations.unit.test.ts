import { listOperations } from "../listOperations";
import * as buildAccount from "../buildAccount";
import type { BitcoinContext } from "../../api/config";

jest.mock("../buildAccount");

const mockedBuild = buildAccount.buildSyncedAccount as jest.MockedFunction<
  typeof buildAccount.buildSyncedAccount
>;

// buildSyncedAccount is mocked, so config is never consumed — the stub just satisfies the
// `context.config(currencyId)` call the logic now makes.
const context = {
  config: async () => ({ status: { type: "active" } }),
} as unknown as BitcoinContext;

function fakeAccount(
  addresses: Array<{ account: number; index: number; address: string }>,
  txs: unknown[],
): Awaited<ReturnType<typeof buildAccount.buildSyncedAccount>> {
  return {
    xpub: {
      getXpubAddresses: async () => addresses,
      storage: { getTxs: () => txs },
    },
  } as unknown as Awaited<ReturnType<typeof buildAccount.buildSyncedAccount>>;
}

const options = { minHeight: 0, derivationPath: "84'/0'/0'" };

describe("logic/listOperations", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("maps an incoming tx to an IN operation crediting an account address", async () => {
    const addresses = [{ account: 0, index: 0, address: "addrA" }];
    const txs = [
      {
        id: "tx1",
        hash: "tx1",
        account: 0,
        index: 0,
        received_at: "2024-01-01T00:00:00Z",
        block: { height: 100, hash: "b100", time: "2024-01-01T00:00:00Z" },
        address: "addrA",
        inputs: [
          { value: "500000", address: "external", output_hash: "p", output_index: 0, sequence: 0 },
        ],
        outputs: [
          {
            value: "40000",
            address: "addrA",
            output_hash: "tx1",
            output_index: 0,
            block_height: 100,
            rbf: false,
          },
        ],
        fees: 1000,
      },
    ];
    mockedBuild.mockResolvedValue(fakeAccount(addresses, txs));

    const page = await listOperations(context, "bitcoin", "zpub", options);

    expect(page.items).toHaveLength(1);
    expect(page.items[0].type).toBe("IN");
    expect(page.items[0].value).toBe(40000n);
    expect(page.items[0].recipients).toEqual(["addrA"]);
    expect(page.items[0].id).toBe("tx1-IN");
    expect(page.next).toBe(undefined);
  });

  it("maps a spending tx to an OUT operation with value = amount + fees", async () => {
    const addresses = [
      { account: 0, index: 0, address: "addrA" },
      { account: 1, index: 0, address: "changeA" },
    ];
    const txs = [
      {
        id: "tx2",
        hash: "tx2",
        account: 0,
        index: 0,
        received_at: "2024-02-01T00:00:00Z",
        block: { height: 200, hash: "b200", time: "2024-02-01T00:00:00Z" },
        address: "addrA",
        inputs: [
          { value: "100000", address: "addrA", output_hash: "p", output_index: 0, sequence: 0 },
        ],
        outputs: [
          {
            value: "70000",
            address: "dest",
            output_hash: "tx2",
            output_index: 0,
            block_height: 200,
            rbf: false,
          },
          {
            value: "29000",
            address: "changeA",
            output_hash: "tx2",
            output_index: 1,
            block_height: 200,
            rbf: false,
          },
        ],
        fees: 1000,
      },
    ];
    mockedBuild.mockResolvedValue(fakeAccount(addresses, txs));

    const page = await listOperations(context, "bitcoin", "zpub", options);

    // Alpaca convention: OUT value is fee-EXCLUDED (the adapter re-adds fees). Amount to "dest" = 70000.
    expect(page.items[0].type).toBe("OUT");
    expect(page.items[0].value).toBe(70000n);
    expect(page.items[0].recipients).toEqual(["dest"]);
  });

  // Helper: an incoming tx crediting `address` at `height`, hash = tx id.
  const inTx = (hash: string, height: number, address: string): Record<string, unknown> => ({
    id: hash,
    hash,
    account: 0,
    index: 0,
    received_at: "2024-01-01T00:00:00Z",
    block: { height, hash: `b${height}`, time: "2024-01-01T00:00:00Z" },
    address,
    inputs: [
      { value: "500000", address: "external", output_hash: "p", output_index: 0, sequence: 0 },
    ],
    outputs: [
      {
        value: "40000",
        address,
        output_hash: hash,
        output_index: 0,
        block_height: height,
        rbf: false,
      },
    ],
    fees: 1000,
  });

  it("aggregates operations across more than one derived address (account-wide)", async () => {
    const addresses = [
      { account: 0, index: 0, address: "addrA" },
      { account: 0, index: 1, address: "addrB" },
    ];
    const txs = [inTx("txA", 100, "addrA"), inTx("txB", 200, "addrB")];
    mockedBuild.mockResolvedValue(fakeAccount(addresses, txs));

    const page = await listOperations(context, "bitcoin", "zpub", options);

    expect(page.items).toHaveLength(2);
    expect(page.items.every(op => op.type === "IN")).toBe(true);
    expect(new Set(page.items.flatMap(op => op.recipients))).toEqual(new Set(["addrA", "addrB"]));
  });

  it("emits both an OUT and an IN for a self-send to the account's own (non-change) address", async () => {
    const addresses = [
      { account: 0, index: 0, address: "addrA" }, // funds the tx
      { account: 0, index: 1, address: "addrB" }, // self-send destination (non-change)
      { account: 1, index: 0, address: "changeA" }, // change
    ];
    const txs = [
      {
        id: "txSelf",
        hash: "txSelf",
        account: 0,
        index: 0,
        received_at: "2024-04-01T00:00:00Z",
        block: { height: 400, hash: "b400", time: "2024-04-01T00:00:00Z" },
        address: "addrA",
        inputs: [
          { value: "100000", address: "addrA", output_hash: "p", output_index: 0, sequence: 0 },
        ],
        outputs: [
          { value: "90000", address: "addrB", output_hash: "txSelf", output_index: 0, rbf: false },
          { value: "9000", address: "changeA", output_hash: "txSelf", output_index: 1, rbf: false },
        ],
        fees: 1000,
      },
    ];
    mockedBuild.mockResolvedValue(fakeAccount(addresses, txs));

    const page = await listOperations(context, "bitcoin", "zpub", options);

    expect(page.items).toHaveLength(2);
    const byId = Object.fromEntries(page.items.map(op => [op.id, op]));
    // Fee-excluded value: the self-sent amount (change is excluded), on both legs.
    expect(byId["txSelf-OUT"].type).toBe("OUT");
    expect(byId["txSelf-OUT"].value).toBe(90000n);
    expect(byId["txSelf-OUT"].recipients).toEqual(["addrB"]);
    expect(byId["txSelf-IN"].type).toBe("IN");
    expect(byId["txSelf-IN"].value).toBe(90000n);
    expect(byId["txSelf-IN"].recipients).toEqual(["addrB"]);
  });

  it("does not emit a spurious IN for an ordinary send's change output", async () => {
    const addresses = [
      { account: 0, index: 0, address: "addrA" },
      { account: 1, index: 0, address: "changeA" },
    ];
    const txs = [
      {
        id: "txSend",
        hash: "txSend",
        account: 0,
        index: 0,
        received_at: "2024-05-01T00:00:00Z",
        block: { height: 500, hash: "b500", time: "2024-05-01T00:00:00Z" },
        address: "addrA",
        inputs: [
          { value: "100000", address: "addrA", output_hash: "p", output_index: 0, sequence: 0 },
        ],
        outputs: [
          { value: "70000", address: "dest", output_hash: "txSend", output_index: 0, rbf: false },
          {
            value: "29000",
            address: "changeA",
            output_hash: "txSend",
            output_index: 1,
            rbf: false,
          },
        ],
        fees: 1000,
      },
    ];
    mockedBuild.mockResolvedValue(fakeAccount(addresses, txs));

    const page = await listOperations(context, "bitcoin", "zpub", options);

    expect(page.items).toHaveLength(1);
    expect(page.items[0].id).toBe("txSend-OUT");
    expect(page.items[0].value).toBe(70000n);
    expect(page.items[0].recipients).toEqual(["dest"]);
  });

  it("credits the change address as recipient for a pure receive landing on the change chain", async () => {
    const addresses = [
      { account: 0, index: 0, address: "addrA" },
      { account: 1, index: 0, address: "changeA" },
    ];
    // No account input (pure receive), and the only account output is on the internal/change chain.
    const txs = [
      {
        id: "txRcv",
        hash: "txRcv",
        account: 1,
        index: 0,
        received_at: "2024-06-01T00:00:00Z",
        block: { height: 600, hash: "b600", time: "2024-06-01T00:00:00Z" },
        address: "changeA",
        inputs: [
          { value: "500000", address: "external", output_hash: "p", output_index: 0, sequence: 0 },
        ],
        outputs: [
          { value: "45000", address: "changeA", output_hash: "txRcv", output_index: 0, rbf: false },
        ],
        fees: 1000,
      },
    ];
    mockedBuild.mockResolvedValue(fakeAccount(addresses, txs));

    const page = await listOperations(context, "bitcoin", "zpub", options);

    expect(page.items).toHaveLength(1);
    expect(page.items[0].id).toBe("txRcv-IN");
    expect(page.items[0].value).toBe(45000n);
    expect(page.items[0].recipients).toEqual(["changeA"]);
  });

  it("deduplicates a transaction stored once per touched address (wallet-btc address+id index)", async () => {
    // wallet-btc indexes a tx per (address, id): a tx crediting two of the account's addresses is
    // returned twice by getTxs — same id/hash, differing `.address`. Both carry the full outputs.
    const addresses = [
      { account: 0, index: 0, address: "addrA" },
      { account: 0, index: 1, address: "addrB" },
    ];
    const sharedOutputs = [
      { value: "40000", address: "addrA", output_hash: "txDup", output_index: 0, rbf: false },
      { value: "25000", address: "addrB", output_hash: "txDup", output_index: 1, rbf: false },
    ];
    const entry = (address: string): Record<string, unknown> => ({
      id: "txDup",
      hash: "txDup",
      account: 0,
      index: 0,
      received_at: "2024-03-01T00:00:00Z",
      block: { height: 300, hash: "b300", time: "2024-03-01T00:00:00Z" },
      address,
      inputs: [
        { value: "500000", address: "external", output_hash: "p", output_index: 0, sequence: 0 },
      ],
      outputs: sharedOutputs,
      fees: 1000,
    });
    mockedBuild.mockResolvedValue(fakeAccount(addresses, [entry("addrA"), entry("addrB")]));

    const page = await listOperations(context, "bitcoin", "zpub", options);

    expect(page.items).toHaveLength(1);
    expect(page.items[0].id).toBe("txDup-IN");
    expect(page.items[0].value).toBe(65000n);
    expect(page.next).toBeUndefined();
  });

  it("pages with a non-volatile cursor that round-trips across pages", async () => {
    const addresses = [{ account: 0, index: 0, address: "addrA" }];
    // Heights 100/200/300 → desc order tx300, tx200, tx100.
    const txs = [
      inTx("tx100", 100, "addrA"),
      inTx("tx200", 200, "addrA"),
      inTx("tx300", 300, "addrA"),
    ];
    mockedBuild.mockResolvedValue(fakeAccount(addresses, txs));

    const first = await listOperations(context, "bitcoin", "zpub", { ...options, limit: 2 });
    expect(first.items.map(op => op.id)).toEqual(["tx300-IN", "tx200-IN"]);
    expect(first.next).toBe("tx200-IN");

    const second = await listOperations(context, "bitcoin", "zpub", {
      ...options,
      limit: 2,
      cursor: first.next,
    });
    expect(second.items.map(op => op.id)).toEqual(["tx100-IN"]);
    expect(second.next).toBeUndefined();
  });

  it("throws on a stale/unknown cursor rather than silently restarting", async () => {
    const addresses = [{ account: 0, index: 0, address: "addrA" }];
    mockedBuild.mockResolvedValue(fakeAccount(addresses, [inTx("tx100", 100, "addrA")]));

    await expect(
      listOperations(context, "bitcoin", "zpub", { ...options, cursor: "does-not-exist" }),
    ).rejects.toThrow(/unknown cursor/);
  });
});
