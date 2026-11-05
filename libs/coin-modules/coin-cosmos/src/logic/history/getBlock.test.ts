import type { CosmosCoinConfig } from "../../config";
import { CosmosAPI } from "../../network/Cosmos";
import { GET_BLOCK_WITH_TXS_SDK_EXAMPLE } from "../../network/fixtures";
import { BlockTxSDK, GetBlockWithTxsSDK } from "../../network/types";
import { toBlockInfo } from "../../network/utils";
import { getBlock } from "./getBlock";

const TX_HASH = "69FA03588DDD5D61DEA9A47CD51EC4E02921174E24C2A81610124BBA7131F51D";
const SENDER = "cosmos16exhyvwyy82fnavqgupf67lku4jvvd82h7p20u";
const RECIPIENT = "cosmos16na4yg4rtt4n8j72n54uy5mvxn7f08l7t4h3xv";
const config = { denom: "uatom" } as CosmosCoinConfig;
const [baseTx] = GET_BLOCK_WITH_TXS_SDK_EXAMPLE.txs;

function makeTx(overrides: {
  messages?: BlockTxSDK["body"]["messages"];
  fee?: Partial<BlockTxSDK["auth_info"]["fee"]>;
}): BlockTxSDK {
  return {
    ...baseTx,
    body: { ...baseTx.body, messages: overrides.messages ?? baseTx.body.messages },
    auth_info: { fee: { ...baseTx.auth_info.fee, ...overrides.fee } },
  };
}

function makeApi(
  blockWithTxs: GetBlockWithTxsSDK,
  results: { txhash: string; code: number }[] = [{ txhash: TX_HASH, code: 0 }],
) {
  const getBlockWithTxs = jest.fn(async (_height: number) => blockWithTxs);
  const getTransactionsByHeight = jest.fn(async (_height: number) => results);
  return {
    api: { getBlockWithTxs, getTransactionsByHeight } as unknown as CosmosAPI,
    getBlockWithTxs,
    getTransactionsByHeight,
  };
}

function blockWithTx(tx: BlockTxSDK): GetBlockWithTxsSDK {
  return { ...GET_BLOCK_WITH_TXS_SDK_EXAMPLE, txs: [tx] };
}

describe("getBlock", () => {
  it("maps the block header and its transactions", async () => {
    const { api, getBlockWithTxs, getTransactionsByHeight } = makeApi(
      GET_BLOCK_WITH_TXS_SDK_EXAMPLE,
    );

    const block = await getBlock(config, api, 33721701);

    expect(getBlockWithTxs).toHaveBeenCalledWith(33721701);
    expect(getTransactionsByHeight).toHaveBeenCalledWith(33721701);
    expect(block).toEqual({
      info: {
        height: 33721701,
        hash: GET_BLOCK_WITH_TXS_SDK_EXAMPLE.block_id.hash,
        time: new Date("2026-11-04T10:25:03.669957328Z"),
      },
      transactions: [
        {
          hash: TX_HASH,
          failed: false,
          fees: 3629n,
          feesPayer: SENDER,
          operations: [
            {
              type: "transfer",
              address: SENDER,
              peer: RECIPIENT,
              asset: { type: "native" },
              amount: -202952273n,
            },
            {
              type: "transfer",
              address: RECIPIENT,
              peer: SENDER,
              asset: { type: "native" },
              amount: 202952273n,
            },
          ],
        },
      ],
    });
  });

  it("returns the same block info as toBlockInfo for the response", async () => {
    const { api } = makeApi(GET_BLOCK_WITH_TXS_SDK_EXAMPLE);

    const block = await getBlock(config, api, 33721701);

    expect(block.info).toEqual(toBlockInfo(GET_BLOCK_WITH_TXS_SDK_EXAMPLE));
  });

  it("reads the raw transactions from sdk_block when it is available", async () => {
    const { block } = GET_BLOCK_WITH_TXS_SDK_EXAMPLE;
    const { api } = makeApi({
      ...GET_BLOCK_WITH_TXS_SDK_EXAMPLE,
      block: { ...block, data: { txs: [] } },
      sdk_block: block,
    });

    const result = await getBlock(config, api, 33721701);

    expect(result.transactions.map(tx => tx.hash)).toEqual([TX_HASH]);
  });

  it("returns no transactions for an empty block", async () => {
    const { block } = GET_BLOCK_WITH_TXS_SDK_EXAMPLE;
    const { api } = makeApi(
      { ...GET_BLOCK_WITH_TXS_SDK_EXAMPLE, block: { ...block, data: { txs: [] } }, txs: [] },
      [],
    );

    const result = await getBlock(config, api, 33721701);

    expect(result.transactions).toEqual([]);
  });

  it("keeps a failed transaction, flagged as failed, with its fees", async () => {
    const { api } = makeApi(GET_BLOCK_WITH_TXS_SDK_EXAMPLE, [{ txhash: TX_HASH, code: 5 }]);

    const { transactions } = await getBlock(config, api, 33721701);

    expect(transactions).toEqual([expect.objectContaining({ failed: true, fees: 3629n })]);
  });

  it("rejects when the result of a transaction is missing", async () => {
    const { api } = makeApi(GET_BLOCK_WITH_TXS_SDK_EXAMPLE, []);

    await expect(getBlock(config, api, 33721701)).rejects.toThrow(
      `Missing result for transaction ${TX_HASH} at block height 33721701`,
    );
  });

  it.each([0, -1, 1.5, NaN, Number.MAX_SAFE_INTEGER + 1])(
    "rejects the invalid height %p without calling the api",
    async height => {
      const { api, getBlockWithTxs, getTransactionsByHeight } = makeApi(
        GET_BLOCK_WITH_TXS_SDK_EXAMPLE,
      );

      await expect(getBlock(config, api, height)).rejects.toThrow(
        `Invalid block height: ${height}`,
      );
      expect(getBlockWithTxs).not.toHaveBeenCalled();
      expect(getTransactionsByHeight).not.toHaveBeenCalled();
    },
  );

  it("rejects when the block cannot be fetched", async () => {
    const { api, getBlockWithTxs } = makeApi(GET_BLOCK_WITH_TXS_SDK_EXAMPLE);
    getBlockWithTxs.mockRejectedValue(new Error("invalid height"));

    await expect(getBlock(config, api, 999999999)).rejects.toThrow("invalid height");
  });

  it("rejects when the transaction results cannot be fetched", async () => {
    const { api, getTransactionsByHeight } = makeApi(GET_BLOCK_WITH_TXS_SDK_EXAMPLE);
    getTransactionsByHeight.mockRejectedValue(new Error("results unavailable"));

    await expect(getBlock(config, api, 33721701)).rejects.toThrow("results unavailable");
  });

  describe("fees", () => {
    it("sums only the fee coins of the native denom", async () => {
      const tx = makeTx({
        fee: {
          amount: [
            { denom: "uatom", amount: "100" },
            { denom: "uosmo", amount: "999" },
            { denom: "uatom", amount: "20" },
          ],
        },
      });
      const { api } = makeApi(blockWithTx(tx));

      const { transactions } = await getBlock(config, api, 33721701);

      expect(transactions[0].fees).toBe(120n);
    });

    it("is zero when no fee coin has the native denom", async () => {
      const tx = makeTx({ fee: { amount: [] } });
      const { api } = makeApi(blockWithTx(tx));

      const { transactions } = await getBlock(config, api, 33721701);

      expect(transactions[0].fees).toBe(0n);
    });
  });

  describe("fees payer", () => {
    const payerOf = async (tx: BlockTxSDK) => {
      const { api } = makeApi(blockWithTx(tx));
      const { transactions } = await getBlock(config, api, 33721701);
      return transactions[0].feesPayer;
    };

    it("is the explicit fee payer first", async () => {
      await expect(
        payerOf(makeTx({ fee: { payer: "cosmos1payer", granter: "cosmos1granter" } })),
      ).resolves.toBe("cosmos1payer");
    });

    it("is the granter when there is no explicit fee payer", async () => {
      await expect(
        payerOf(makeTx({ fee: { payer: "", granter: "cosmos1granter" } })),
      ).resolves.toBe("cosmos1granter");
    });

    it("is the signer of the first message otherwise", async () => {
      await expect(payerOf(makeTx({}))).resolves.toBe(SENDER);
    });

    it.each([
      [
        "delegator_address",
        { "@type": "/cosmos.staking.v1beta1.MsgDelegate", delegator_address: "cosmos1del" },
        "cosmos1del",
      ],
      [
        "sender",
        { "@type": "/ibc.applications.transfer.v1.MsgTransfer", sender: "cosmos1snd" },
        "cosmos1snd",
      ],
      [
        "a wrapped msg",
        {
          "@type": "/babylon.epoching.v1.MsgWrappedDelegate",
          msg: { delegator_address: "cosmos1wrapped" },
        },
        "cosmos1wrapped",
      ],
    ])("reads the first signer from %s", async (_name, message, expected) => {
      await expect(payerOf(makeTx({ messages: [message] }))).resolves.toBe(expected);
    });

    it("is absent when the first message has no known signer", async () => {
      const message = { "@type": "/cosmos.gov.v1beta1.MsgVote", voter: "cosmos1voter" };

      await expect(payerOf(makeTx({ messages: [message] }))).resolves.toBeUndefined();
    });

    it("is absent when the first signer is not a string", async () => {
      const message = { "@type": "/cosmos.bank.v1beta1.MsgSend", from_address: 42, amount: [] };

      await expect(payerOf(makeTx({ messages: [message] }))).resolves.toBeUndefined();
    });

    it("is absent, without a key, when the transaction has no message", async () => {
      const { api } = makeApi(blockWithTx(makeTx({ messages: [] })));

      const { transactions } = await getBlock(config, api, 33721701);

      expect(transactions[0]).not.toHaveProperty("feesPayer");
    });
  });

  describe("operations", () => {
    const operationsOf = async (messages: BlockTxSDK["body"]["messages"]) => {
      const { api } = makeApi(blockWithTx(makeTx({ messages })));
      const { transactions } = await getBlock(config, api, 33721701);
      return transactions[0].operations;
    };

    const send = (amount: { denom: string; amount: string }[]) => ({
      "@type": "/cosmos.bank.v1beta1.MsgSend",
      from_address: SENDER,
      to_address: RECIPIENT,
      amount,
    });

    it("reports a debit and a credit for each native coin of a MsgSend", async () => {
      const operations = await operationsOf([
        send([
          { denom: "uatom", amount: "5" },
          { denom: "uatom", amount: "7" },
        ]),
      ]);

      expect(operations.map(op => (op.type === "transfer" ? op.amount : undefined))).toEqual([
        -5n,
        5n,
        -7n,
        7n,
      ]);
    });

    it("ignores the coins of another denom and the zero amounts", async () => {
      const operations = await operationsOf([
        send([
          { denom: "uosmo", amount: "5" },
          { denom: "uatom", amount: "0" },
        ]),
      ]);

      expect(operations).toEqual([]);
    });

    it("reports any other message as an unclassified operation", async () => {
      const operations = await operationsOf([
        { "@type": "/cosmos.staking.v1beta1.MsgDelegate", delegator_address: SENDER },
      ]);

      expect(operations).toEqual([
        { type: "other", messageType: "/cosmos.staking.v1beta1.MsgDelegate" },
      ]);
    });

    it("keeps the order of the messages", async () => {
      const operations = await operationsOf([
        { "@type": "/ibc.core.client.v1.MsgUpdateClient" },
        send([{ denom: "uatom", amount: "1" }]),
      ]);

      expect(operations.map(op => op.type)).toEqual(["other", "transfer", "transfer"]);
    });
  });
});
