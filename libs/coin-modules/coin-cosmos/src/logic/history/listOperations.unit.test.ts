import type { CosmosCoinConfig } from "../../config";
import { CosmosAPI } from "../../network/Cosmos";
import { CosmosTx } from "../../types";
import { listOperations } from "./listOperations";

const ADDR = "cosmos1sender";
const config = { denom: "uatom" } as CosmosCoinConfig;

const makeTx = (overrides: Partial<{ txhash: string; height: string }> = {}): CosmosTx =>
  ({
    txhash: overrides.txhash ?? "HASH1",
    height: overrides.height ?? "100",
    timestamp: "2024-01-01T00:00:00Z",
    code: 0,
    events: [],
    tx: {
      body: {
        messages: [
          {
            "@type": "/cosmos.bank.v1beta1.MsgSend",
            from_address: ADDR,
            to_address: "cosmos1recipient",
            amount: [{ denom: "uatom", amount: "1000000" }],
          },
        ],
        memo: "hello",
      },
      auth_info: {
        fee: { amount: [{ denom: "uatom", amount: "500" }] },
        signer_infos: [{ sequence: "3" }],
      },
    },
  }) as unknown as CosmosTx;

const OTHER = "cosmos1other";

const makeTxFrom = (
  sender: string,
  overrides: Partial<{ txhash: string; height: string }> = {},
  recipient = "cosmos1recipient",
): CosmosTx => {
  const base = makeTx(overrides);
  return {
    ...base,
    tx: {
      ...base.tx,
      body: {
        messages: [
          {
            "@type": "/cosmos.bank.v1beta1.MsgSend",
            from_address: sender,
            to_address: recipient,
            amount: [{ denom: "uatom", amount: "1000000" }],
          },
        ],
        memo: "",
      },
    },
  } as unknown as CosmosTx;
};

const withTransferTo = (tx: CosmosTx, recipient: string): CosmosTx =>
  ({
    ...tx,
    events: [
      ...tx.events,
      {
        type: "transfer",
        attributes: [
          { key: "recipient", value: recipient },
          { key: "amount", value: "1500000uatom" },
        ],
      },
    ],
  }) as unknown as CosmosTx;

const apiWith = (txs: CosmosTx[], hasMore = false): CosmosAPI =>
  ({
    getTransactionsPage: jest.fn().mockResolvedValue({ streams: [{ txs, hasMore }] }),
  }) as unknown as CosmosAPI;

const apiWithStreams = (streams: { txs: CosmosTx[]; hasMore: boolean }[]): CosmosAPI =>
  ({
    getTransactionsPage: jest.fn().mockResolvedValue({ streams }),
  }) as unknown as CosmosAPI;

const makeUnknownTx = (overrides: { txhash: string; height: string }): CosmosTx =>
  ({
    ...makeTx(overrides),
    tx: {
      body: { messages: [{ "@type": "/cosmos.gov.v1beta1.MsgVote" }], memo: "" },
      auth_info: { fee: { amount: [] }, signer_infos: [] },
    },
  }) as unknown as CosmosTx;

const makeDelegateTx = (): CosmosTx =>
  ({
    ...makeTx(),
    tx: {
      body: {
        messages: [
          {
            "@type": "/cosmos.staking.v1beta1.MsgDelegate",
            delegator_address: ADDR,
            validator_address: "cosmosvaloper1v",
            amount: { denom: "uatom", amount: "1000000" },
          },
        ],
        memo: "",
      },
      auth_info: {
        fee: { amount: [{ denom: "uatom", amount: "500" }] },
        signer_infos: [{ sequence: "3" }],
      },
    },
  }) as unknown as CosmosTx;

const makeRedelegateTx = (): CosmosTx =>
  ({
    ...makeTx(),
    tx: {
      body: {
        messages: [
          {
            "@type": "/cosmos.staking.v1beta1.MsgBeginRedelegate",
            delegator_address: ADDR,
            validator_src_address: "cosmosvaloper1src",
            validator_dst_address: "cosmosvaloper1dst",
            amount: { denom: "uatom", amount: "2000000" },
          },
        ],
        memo: "",
      },
      auth_info: {
        fee: { amount: [{ denom: "uatom", amount: "500" }] },
        signer_infos: [{ sequence: "3" }],
      },
    },
  }) as unknown as CosmosTx;

const makeRewardTx = (): CosmosTx =>
  ({
    ...makeTx(),
    events: [
      {
        type: "withdraw_rewards",
        attributes: [
          { key: "amount", value: "1000000uatom" },
          { key: "validator", value: "cosmosvaloper1a" },
        ],
      },
      {
        type: "withdraw_rewards",
        attributes: [
          { key: "amount", value: "500000uatom" },
          { key: "validator", value: "cosmosvaloper1b" },
        ],
      },
    ],
    tx: {
      body: {
        messages: [
          {
            "@type": "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
            delegator_address: ADDR,
            validator_address: "cosmosvaloper1a",
          },
          {
            "@type": "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
            delegator_address: ADDR,
            validator_address: "cosmosvaloper1b",
          },
        ],
        memo: "",
      },
      auth_info: {
        fee: { amount: [{ denom: "uatom", amount: "500" }] },
        signer_infos: [{ sequence: "3" }],
      },
    },
  }) as unknown as CosmosTx;

// Models one newest-first stream that honours `count`, so the fetch window is actually bounded.
const apiCounting = (allTxs: CosmosTx[]): CosmosAPI =>
  ({
    getTransactionsPage: jest.fn(async (_addr: string, count: number) => ({
      streams: [{ txs: allTxs.slice(0, count), hasMore: allTxs.length > count }],
    })),
  }) as unknown as CosmosAPI;

describe("logic/history/listOperations", () => {
  it("maps a native send to an OUT framework operation", async () => {
    const page = await listOperations(config, apiWith([makeTx()]), ADDR, { minHeight: 0 });

    expect(page.items).toHaveLength(1);
    const op = page.items[0];
    expect(op.type).toBe("OUT");
    // value excludes fee (CoinModuleApi convention); the generic framework re-adds it for OUT.
    expect(op.value).toBe(1_000_000n);
    expect(op.senders).toEqual([ADDR]);
    expect(op.recipients).toEqual(["cosmos1recipient"]);
    expect(op.asset).toEqual({ type: "native" });
    expect(op.tx.hash).toBe("HASH1");
    expect(op.tx.block.height).toBe(100);
    expect(op.tx.fees).toBe(500n);
    expect(op.tx.failed).toBe(false);
    expect(op.tx.date).toBeInstanceOf(Date);
    expect(page.next).toBe(undefined);
  });

  it("serializes BigNumber amounts in familyExtra to JSON-safe strings", async () => {
    const page = await listOperations(config, apiWith([makeDelegateTx()]), ADDR, {
      minHeight: 0,
    });
    const details = page.items[0].details as {
      familyExtra: { validators: { amount: unknown }[] };
    };
    expect(details.familyExtra.validators[0].amount).toBe("1000000");
    expect(typeof details.familyExtra.validators[0].amount).toBe("string");
  });

  it("nests staking extras under details.familyExtra for the generic framework's operation adapter", async () => {
    const page = await listOperations(config, apiWith([makeDelegateTx()]), ADDR, {
      minHeight: 0,
    });
    const details = page.items[0].details as {
      familyExtra: { validators: { address: string; amount: string }[] };
    };
    expect(details.familyExtra.validators[0]).toEqual({
      address: "cosmosvaloper1v",
      amount: "1000000",
    });
  });

  it("mirrors primary validator into details.stake for the generic framework adapter", async () => {
    const page = await listOperations(config, apiWith([makeDelegateTx()]), ADDR, {
      minHeight: 0,
    });
    const details = page.items[0].details as {
      stake: { address: string; amount: bigint };
    };
    expect(details.stake.address).toBe("cosmosvaloper1v");
    expect(details.stake.amount).toBe(1000000n);
  });

  it("carries sourceValidator in familyExtra for a redelegate", async () => {
    const page = await listOperations(config, apiWith([makeRedelegateTx()]), ADDR, {
      minHeight: 0,
    });
    const details = page.items[0].details as {
      familyExtra: { validators: { address: string; amount: string }[]; sourceValidator: string };
    };
    expect(details.familyExtra.sourceValidator).toBe("cosmosvaloper1src");
    expect(details.familyExtra.validators[0]).toEqual({
      address: "cosmosvaloper1dst",
      amount: "2000000",
    });
  });

  it("carries all validators in familyExtra for a reward claim", async () => {
    const page = await listOperations(config, apiWith([makeRewardTx()]), ADDR, {
      minHeight: 0,
    });
    const details = page.items[0].details as {
      familyExtra: { validators: { address: string; amount: string }[] };
    };
    expect(details.familyExtra.validators).toEqual([
      { address: "cosmosvaloper1a", amount: "1000000" },
      { address: "cosmosvaloper1b", amount: "500000" },
    ]);
  });

  it("dedupes a tx returned in both the sender and recipient streams", async () => {
    const page = await listOperations(config, apiWith([makeTx(), makeTx()]), ADDR, {
      minHeight: 0,
    });
    expect(page.items).toHaveLength(1);
  });

  it("paginates by cursor/limit and always propagates next", async () => {
    const api = apiWith([
      makeTx({ txhash: "HASH1", height: "100" }),
      makeTx({ txhash: "HASH2", height: "200" }),
    ]);

    const first = await listOperations(config, api, ADDR, { minHeight: 0, limit: 1 });
    expect(first.items).toHaveLength(1);
    expect(first.items[0].tx.hash).toBe("HASH2");
    expect(first.next).toBe("1");

    const second = await listOperations(config, api, ADDR, {
      minHeight: 0,
      limit: 1,
      cursor: "1",
    });
    expect(second.items).toHaveLength(1);
    expect(second.items[0].tx.hash).toBe("HASH1");
    expect(second.next).toBe(undefined);
  });

  it("clamps a negative cursor to the first page", async () => {
    const api = apiWith([
      makeTx({ txhash: "HASH1", height: "100" }),
      makeTx({ txhash: "HASH2", height: "200" }),
    ]);
    const page = await listOperations(config, api, ADDR, {
      minHeight: 0,
      limit: 1,
      cursor: "-1",
    });
    expect(api.getTransactionsPage).toHaveBeenCalledWith(ADDR, 1);
    expect(page.items).toHaveLength(1);
    expect(page.items[0].tx.hash).toBe("HASH2");
  });

  it("requests only offset+limit depth from the network", async () => {
    const api = apiWith([makeTx()]);
    await listOperations(config, api, ADDR, { minHeight: 0, limit: 5, cursor: "10" });
    expect(api.getTransactionsPage).toHaveBeenCalledWith(ADDR, 15);
  });

  it("propagates next when the node reports more and the page is full", async () => {
    const api = apiWith([makeTx({ txhash: "H1", height: "100" })], true);
    const page = await listOperations(config, api, ADDR, { minHeight: 0, limit: 1 });
    expect(page.items).toHaveLength(1);
    expect(page.next).toBe("1");
  });

  it("stops paginating on a short page even when hasMore is true (minHeight boundary)", async () => {
    const api = apiWith([makeTx({ txhash: "OLD", height: "50" })], true);
    const page = await listOperations(config, api, ADDR, { minHeight: 100, limit: 5 });
    expect(page.items).toHaveLength(0);
    expect(page.next).toBeUndefined();
  });

  it("keeps advancing on a short page when more txs exist and the floor isn't reached", async () => {
    const api = apiWith([makeTx({ txhash: "H1", height: "100" })], true);
    const page = await listOperations(config, api, ADDR, { minHeight: 0, limit: 5 });
    expect(page.items).toHaveLength(1);
    expect(page.next).toBe("5");
  });

  it("never skips a valid op across pages when txToOps drops unknown-type txs", async () => {
    const allTxs = [
      makeTx({ txhash: "A", height: "300" }),
      makeUnknownTx({ txhash: "B", height: "250" }),
      makeTx({ txhash: "C", height: "200" }),
      makeUnknownTx({ txhash: "D", height: "150" }),
      makeTx({ txhash: "E", height: "100" }),
    ];
    const api = apiCounting(allTxs);

    const seen: string[] = [];
    let cursor: string | undefined;
    let guard = 0;
    do {
      const page = await listOperations(config, api, ADDR, { minHeight: 0, limit: 2, cursor });
      seen.push(...page.items.map(o => o.tx.hash));
      cursor = page.next;
      if (++guard > 10) throw new Error("pagination did not terminate");
    } while (cursor);

    expect(seen).toEqual(["A", "C", "E"]);
  });

  it("orders equal-height operations deterministically by id, independent of fetch order", async () => {
    const api = apiWith([
      makeTx({ txhash: "BBB", height: "100" }),
      makeTx({ txhash: "AAA", height: "100" }),
    ]);
    const page = await listOperations(config, api, ADDR, { minHeight: 0 });
    expect(page.items.map(o => o.tx.hash)).toEqual(["AAA", "BBB"]);
  });

  describe("failed transactions", () => {
    const makeFailedTx = (txhash = "FAILED"): CosmosTx =>
      ({ ...makeTx({ txhash }), code: 5 }) as unknown as CosmosTx;

    it("keeps a failed outbound send with its fees and a zero value", async () => {
      const page = await listOperations(config, apiWith([makeFailedTx()]), ADDR, {
        minHeight: 0,
      });

      expect(page.items).toEqual([
        expect.objectContaining({
          type: "OUT",
          value: 0n,
          tx: expect.objectContaining({ hash: "FAILED", fees: 500n, failed: true }),
        }),
      ]);
    });

    it("keeps a failed delegate with its fees and a zero value", async () => {
      const failedDelegate = {
        ...makeDelegateTx(),
        txhash: "FAILED_DELEGATE",
        code: 5,
      } as unknown as CosmosTx;

      const page = await listOperations(config, apiWith([failedDelegate]), ADDR, {
        minHeight: 0,
      });

      expect(page.items).toEqual([
        expect.objectContaining({
          type: "DELEGATE",
          value: 0n,
          tx: expect.objectContaining({ hash: "FAILED_DELEGATE", fees: 500n, failed: true }),
        }),
      ]);
    });

    it("drops a failed tx sent by another account whose fees the address pays", async () => {
      const sponsored = {
        ...makeTxFrom(OTHER, { txhash: "GRANTED" }),
        code: 5,
      } as unknown as CosmosTx;

      const page = await listOperations(config, apiWith([sponsored]), ADDR, { minHeight: 0 });

      expect(page.items).toEqual([]);
    });

    it("drops a failed incoming transfer whose fees the address pays", async () => {
      const sponsored = {
        ...makeTxFrom(OTHER, { txhash: "FAILED_IN" }, ADDR),
        code: 5,
      } as unknown as CosmosTx;

      const page = await listOperations(config, apiWith([sponsored]), ADDR, { minHeight: 0 });

      expect(page.items).toEqual([]);
    });

    it("does not skip valid txs when dropped failed txs fill the fetch window", async () => {
      const api = apiCounting([
        { ...makeTxFrom(OTHER, { txhash: "G1", height: "400" }), code: 5 } as unknown as CosmosTx,
        { ...makeTxFrom(OTHER, { txhash: "G2", height: "300" }), code: 5 } as unknown as CosmosTx,
        makeTx({ txhash: "A", height: "200" }),
        makeTx({ txhash: "B", height: "100" }),
      ]);

      const first = await listOperations(config, api, ADDR, { minHeight: 0, limit: 2 });
      const second = await listOperations(config, api, ADDR, {
        minHeight: 0,
        limit: 2,
        cursor: first.next,
      });

      expect(first.items).toEqual([]);
      expect(first.next).toBe("2");
      expect(second.items.map(o => o.tx.hash)).toEqual(["A", "B"]);
    });

    it("dedupes a failed tx returned by several streams", async () => {
      const failed = makeFailedTx();

      const page = await listOperations(
        config,
        apiWithStreams([
          { txs: [failed], hasMore: false },
          { txs: [failed], hasMore: false },
        ]),
        ADDR,
        { minHeight: 0 },
      );

      expect(page.items).toEqual([
        expect.objectContaining({ tx: expect.objectContaining({ hash: "FAILED" }) }),
      ]);
    });
  });

  describe("transactions sponsored by the address", () => {
    const makeSponsoredReward = (): CosmosTx => {
      const reward = makeRewardTx();
      return {
        ...reward,
        txhash: "SPONSORED_REWARD",
        tx: {
          ...reward.tx,
          body: {
            messages: [
              {
                "@type": "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
                delegator_address: OTHER,
                validator_address: "cosmosvaloper1a",
              },
            ],
            memo: "",
          },
        },
      } as unknown as CosmosTx;
    };

    const makeSponsoredUndelegate = (): CosmosTx => {
      const undelegate = makeTx({ txhash: "SPONSORED_UNDELEGATE" });
      return {
        ...undelegate,
        tx: {
          ...undelegate.tx,
          body: {
            messages: [
              {
                "@type": "/cosmos.staking.v1beta1.MsgUndelegate",
                delegator_address: OTHER,
                validator_address: "cosmosvaloper1v",
                amount: { denom: "uatom", amount: "1000000" },
              },
            ],
            memo: "",
          },
        },
      } as unknown as CosmosTx;
    };

    it("drops a successful reward withdrawal of another account", async () => {
      const page = await listOperations(config, apiWith([makeSponsoredReward()]), ADDR, {
        minHeight: 0,
      });

      expect(page.items).toEqual([]);
    });

    it("drops a successful undelegation of another account", async () => {
      const page = await listOperations(config, apiWith([makeSponsoredUndelegate()]), ADDR, {
        minHeight: 0,
      });

      expect(page.items).toEqual([]);
    });

    it("keeps a successful reward withdrawal of another account paid to the address", async () => {
      const page = await listOperations(
        config,
        apiWith([withTransferTo(makeSponsoredReward(), ADDR)]),
        ADDR,
        { minHeight: 0 },
      );

      expect(page.items).toEqual([
        expect.objectContaining({
          type: "REWARD",
          tx: expect.objectContaining({ hash: "SPONSORED_REWARD", failed: false }),
        }),
      ]);
    });

    it("drops a successful reward withdrawal of another account paid to a third party", async () => {
      const page = await listOperations(
        config,
        apiWith([withTransferTo(makeSponsoredReward(), "cosmos1third")]),
        ADDR,
        { minHeight: 0 },
      );

      expect(page.items).toEqual([]);
    });

    it("drops a failed reward withdrawal of another account even if a transfer credits the address", async () => {
      const failed = { ...withTransferTo(makeSponsoredReward(), ADDR), code: 5 } as CosmosTx;

      const page = await listOperations(config, apiWith([failed]), ADDR, { minHeight: 0 });

      expect(page.items).toEqual([]);
    });

    it("keeps a successful incoming transfer", async () => {
      const page = await listOperations(
        config,
        apiWith([makeTxFrom(OTHER, { txhash: "INCOMING" }, ADDR)]),
        ADDR,
        { minHeight: 0 },
      );

      expect(page.items).toEqual([
        expect.objectContaining({ type: "IN", tx: expect.objectContaining({ hash: "INCOMING" }) }),
      ]);
    });

    it("does not skip valid txs when dropped sponsored txs fill the fetch window", async () => {
      const api = apiCounting([
        { ...makeSponsoredReward(), height: "300" } as CosmosTx,
        makeTx({ txhash: "A", height: "200" }),
      ]);

      const first = await listOperations(config, api, ADDR, { minHeight: 0, limit: 1 });
      const second = await listOperations(config, api, ADDR, {
        minHeight: 0,
        limit: 1,
        cursor: first.next,
      });

      expect(first.items).toEqual([]);
      expect(first.next).toBe("1");
      expect(second.items.map(o => o.tx.hash)).toEqual(["A"]);
    });
  });

  describe("floor with several streams", () => {
    const incoming = (txhash: string, height: string): CosmosTx =>
      makeTxFrom(OTHER, { txhash, height }, ADDR);

    it("keeps paging when only another stream has reached the floor", async () => {
      const oldFailed = {
        ...makeTx({ txhash: "OLD_FAILED", height: "100" }),
        code: 5,
      } as unknown as CosmosTx;
      const api = apiWithStreams([
        { txs: [], hasMore: false },
        { txs: [incoming("R400", "400"), incoming("R300", "300")], hasMore: true },
        { txs: [oldFailed], hasMore: false },
      ]);

      const page = await listOperations(config, api, ADDR, { minHeight: 150, limit: 2 });

      expect(page.items.map(o => o.tx.hash)).toEqual(["R400", "R300"]);
      expect(page.next).toBe("2");
    });

    it("stops once every stream with more results has reached the floor", async () => {
      const api = apiWithStreams([
        { txs: [incoming("R400", "400"), incoming("R100", "100")], hasMore: true },
        { txs: [], hasMore: false },
      ]);

      const page = await listOperations(config, api, ADDR, { minHeight: 150, limit: 2 });

      expect(page.items.map(o => o.tx.hash)).toEqual(["R400"]);
      expect(page.next).toBeUndefined();
    });
  });

  it("rejects ascending order (backend pages newest-first)", async () => {
    await expect(
      listOperations(config, apiWith([makeTx()]), ADDR, { minHeight: 0, order: "asc" }),
    ).rejects.toThrow("ascending order is not supported");
  });
});
