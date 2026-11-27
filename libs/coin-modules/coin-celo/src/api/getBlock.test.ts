import type { Block, BlockOperation } from "@ledgerhq/coin-module-framework/api/index";
import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { CELO_ERC20_ADDRESS } from "../constants";
import { makeGetBlock } from "./getBlock";

const HEIGHT = 83560965;
const FROM = "0x16Aa300b46ca676A6eF84C55c5AD361cBb65C001";
const TO = "0xF3c53A1AE758801cEEAf3774572f464451479A66";
const USDC = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";

const mockCtx: Context<CurrencyConfig> = {
  config: async () => ({
    status: { type: "active" },
    name: "Celo",
    unit: { name: "CELO", code: "CELO", magnitude: 18 },
  }),
  logger: () => {},
};

const tokenDebit = (assetReference: string): BlockOperation => ({
  type: "transfer",
  address: FROM,
  peer: TO,
  asset: { type: "erc20", assetReference },
  amount: -10n,
});

const tokenCredit = (assetReference: string): BlockOperation => ({
  type: "transfer",
  address: TO,
  peer: FROM,
  asset: { type: "erc20", assetReference },
  amount: 10n,
});

const blockWith = (operations: BlockOperation[]): Block => ({
  info: { height: HEIGHT, hash: "0xblock", time: new Date(0) },
  transactions: [
    {
      hash: "0xhash",
      failed: false,
      operations,
      fees: 2816n,
      feesAsset: { type: "erc20", assetReference: USDC },
      feesPayer: FROM,
      details: { sequence: 3 },
    },
  ],
});

const getOperations = async (operations: BlockOperation[]): Promise<BlockOperation[]> => {
  const block = await makeGetBlock(async () => blockWith(operations))(mockCtx, HEIGHT);
  return block.transactions[0].operations;
};

describe("makeGetBlock", () => {
  it("passes the request through to the base getBlock", async () => {
    const base = jest.fn(async () => blockWith([]));

    await makeGetBlock(base)(mockCtx, HEIGHT);

    expect(base).toHaveBeenCalledWith(mockCtx, HEIGHT);
  });

  it.each([
    ["checksummed", CELO_ERC20_ADDRESS],
    ["lower-case", CELO_ERC20_ADDRESS.toLowerCase()],
  ])("reports both sides of a GoldToken transfer (%s contract) as native", async (_, contract) => {
    expect(await getOperations([tokenDebit(contract), tokenCredit(contract)])).toEqual([
      { type: "transfer", address: FROM, peer: TO, asset: { type: "native" }, amount: -10n },
      { type: "transfer", address: TO, peer: FROM, asset: { type: "native" }, amount: 10n },
    ]);
  });

  it("leaves native transfers, other tokens and other operations untouched, in order", async () => {
    const native: BlockOperation = {
      type: "transfer",
      address: FROM,
      asset: { type: "native" },
      amount: -1n,
    };
    const other: BlockOperation = { type: "other", asset: CELO_ERC20_ADDRESS };
    const usdc = tokenDebit(USDC);

    const operations = await getOperations([native, usdc, other]);

    expect(operations[0]).toBe(native);
    expect(operations[1]).toBe(usdc);
    expect(operations[2]).toBe(other);
  });

  it("keeps the block info and the fee of the transactions", async () => {
    const source = blockWith([tokenDebit(CELO_ERC20_ADDRESS)]);

    const block = await makeGetBlock(async () => source)(mockCtx, HEIGHT);

    const { operations: _operations, ...transaction } = source.transactions[0];
    expect(block.info).toBe(source.info);
    expect(block.transactions[0]).toMatchObject(transaction);
  });
});
