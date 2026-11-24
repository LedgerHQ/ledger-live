import type { Operation, Page } from "@ledgerhq/coin-module-framework/api/index";
import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { CELO_ERC20_ADDRESS } from "../constants";
import { makeListOperations } from "./listOperations";

const ADDR = "0x383d91Eb81a9B4Ba22441990839b10048257E2C7";
const ROUTER = "0xce16F69375520ab01377ce7B88f5BA8C48F8D666";
const POOL = "0xaD6Cea45f98444a922a2b4fE96b8C90F0862D2F4";
const USDC = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
const OPTIONS = { minHeight: 0, limit: 10, order: "asc" as const };

const mockCtx: Context<CurrencyConfig> = {
  config: async () => ({
    status: { type: "active" },
    name: "Celo",
    unit: { name: "CELO", code: "CELO", magnitude: 18 },
  }),
  logger: () => {},
};

const tokenOut = (assetReference: string): Operation => ({
  id: "0xhash-erc20-0-OUT",
  type: "OUT",
  senders: [ADDR],
  recipients: [POOL],
  value: 2800n,
  asset: { type: "erc20", assetReference, assetOwner: ADDR },
  tx: {
    hash: "0xhash",
    block: { height: 42990889, hash: "0xblock", time: new Date(0) },
    fees: 60n,
    feesAsset: { type: "erc20", assetReference: USDC },
    feesPayer: ADDR,
    date: new Date(0),
    failed: false,
  },
  details: {
    sequence: "1",
    gasPrice: "25020000000",
    gasLimit: "474794",
    ledgerOpType: "OUT",
    assetAmount: "2800",
    assetSenders: [ADDR],
    assetRecipients: [POOL],
    parentSenders: [ADDR],
    parentRecipients: [ROUTER],
    contractInteraction: "SmartContractInteraction",
    contractAddress: ROUTER,
    contractPayload: "0x58181a80",
  },
});

const nativeFeeCarrier: Operation = {
  ...tokenOut(USDC),
  id: "native-fee-carrier",
  value: 0n,
  asset: { type: "native" },
  details: { sequence: "0" },
};

const listWith = async (items: Operation[], next?: string): Promise<Page<Operation>> =>
  makeListOperations(async () => ({ items, next }))(mockCtx, ADDR, OPTIONS);

describe("makeListOperations", () => {
  it("passes the request through to the base listOperations", async () => {
    const base = jest.fn(async (): Promise<Page<Operation>> => ({ items: [], next: undefined }));

    await makeListOperations(base)(mockCtx, ADDR, OPTIONS);

    expect(base).toHaveBeenCalledWith(mockCtx, ADDR, OPTIONS);
  });

  it.each([
    ["checksummed", CELO_ERC20_ADDRESS],
    ["lower-case", CELO_ERC20_ADDRESS.toLowerCase()],
  ])("reports a GoldToken transfer (%s contract) as native CELO", async (_, contract) => {
    const { items } = await listWith([tokenOut(contract)]);

    expect(items).toHaveLength(1);
    expect(items[0].asset).toEqual({ type: "native" });
  });

  it("keeps the id, the amount, the parties and the fee of a GoldToken transfer", async () => {
    const transfer = tokenOut(CELO_ERC20_ADDRESS);

    const [operation] = (await listWith([transfer])).items;

    const { asset: _asset, details: _details, ...kept } = transfer;
    expect(operation).toMatchObject(kept);
    expect(operation.tx).toBe(transfer.tx);
  });

  it("removes the details that describe the token, and keeps the transaction ones", async () => {
    const [operation] = (await listWith([tokenOut(CELO_ERC20_ADDRESS)])).items;

    expect(operation.details).toEqual({
      sequence: "1",
      gasPrice: "25020000000",
      gasLimit: "474794",
      parentSenders: [ADDR],
      parentRecipients: [ROUTER],
      contractInteraction: "SmartContractInteraction",
      contractAddress: ROUTER,
      contractPayload: "0x58181a80",
    });
  });

  it("keeps who sent the transaction when another account moved the CELO of the account", async () => {
    const spender = "0x89c6340B1a1f4b25D36cd8B063D49045caF3f818";
    const transfer = tokenOut(CELO_ERC20_ADDRESS);
    const movedBySpender: Operation = {
      ...transfer,
      tx: { ...transfer.tx, feesPayer: spender },
      details: { ...transfer.details, parentSenders: [spender], parentRecipients: [ADDR] },
    };

    const [operation] = (await listWith([movedBySpender])).items;

    expect(operation.senders).toEqual([ADDR]);
    expect(operation.tx.feesPayer).toBe(spender);
    expect(operation.details).toMatchObject({
      parentSenders: [spender],
      parentRecipients: [ADDR],
    });
  });

  it("gives each operation an asset of its own", async () => {
    const { items } = await listWith([tokenOut(CELO_ERC20_ADDRESS), tokenOut(CELO_ERC20_ADDRESS)]);

    expect(items[0].asset).not.toBe(items[1].asset);
  });

  it("adds no details to a GoldToken transfer without any", async () => {
    const { details: _details, ...transfer } = tokenOut(CELO_ERC20_ADDRESS);

    const [operation] = (await listWith([transfer])).items;

    expect(operation).not.toHaveProperty("details");
  });

  it("leaves native operations and other tokens untouched, in order", async () => {
    const usdc = tokenOut(USDC);

    const { items } = await listWith([nativeFeeCarrier, tokenOut(CELO_ERC20_ADDRESS), usdc]);

    expect(items[0]).toBe(nativeFeeCarrier);
    expect(items[2]).toBe(usdc);
    expect(items.map(({ id }) => id)).toEqual(["native-fee-carrier", usdc.id, usdc.id]);
  });

  it("keeps the paging cursor", async () => {
    const { next } = await listWith([tokenOut(CELO_ERC20_ADDRESS)], "cursor");

    expect(next).toBe("cursor");
  });
});
