import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import type {
  AssetInfo,
  BlockOperation,
  Operation,
} from "@ledgerhq/coin-module-framework/api/index";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { celoDefaults } from "../config";
import { createApi } from "./index";
import { isGoldToken } from "./goldToken";

const context: Context<EvmConfigInfo> = {
  config: async () => celoDefaults.celo,
  logger: () => {},
};

const CELO_HOLDER = "0x383d91Eb81a9B4Ba22441990839b10048257E2C7";
const USDT: AssetInfo = {
  type: "erc20",
  assetReference: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
};

const CELO: AssetInfo = { type: "native" };

const api = createApi();

const isNative = (asset: AssetInfo | undefined): boolean => asset?.type === "native";

const sum = (amounts: bigint[]): bigint => amounts.reduce((total, amount) => total + amount, 0n);

const transferLegs = (
  from: string,
  to: string,
  asset: AssetInfo,
  amount: bigint,
): BlockOperation[] => [
  { type: "transfer", address: from, peer: to, asset, amount: -amount },
  { type: "transfer", address: to, peer: from, asset, amount },
];

const listAllOperations = async (address: string): Promise<Operation[]> => {
  const operations: Operation[] = [];
  let cursor: string | undefined;
  do {
    const page = await api.listOperations(context, address, {
      minHeight: 0,
      order: "asc",
      limit: 10,
      ...(cursor && { cursor }),
    });
    operations.push(...page.items);
    cursor = page.next;
  } while (cursor);
  return operations;
};

const nativeBalanceChange = (operations: Operation[]): bigint =>
  sum(
    operations
      .filter(({ asset, tx }) => isNative(asset) && !tx.failed)
      .map(({ type, value }) => (type === "IN" ? value : -value)),
  );

const nativeFeesPaidBy = (address: string, operations: Operation[]): bigint => {
  const feesByTransaction = new Map(
    operations
      .filter(
        ({ tx }) => isNative(tx.feesAsset) && tx.feesPayer?.toLowerCase() === address.toLowerCase(),
      )
      .map(({ tx }) => [tx.hash, tx.fees]),
  );
  return sum([...feesByTransaction.values()]);
};

describe("Celo api (mainnet)", () => {
  it("rebuilds the native balance of an account from all the pages of its operations", async () => {
    const [balances, operations] = await Promise.all([
      api.getBalance(context, CELO_HOLDER),
      listAllOperations(CELO_HOLDER),
    ]);

    expect(operations.some(({ value, asset }) => isNative(asset) && value > 0n)).toBe(true);
    expect(nativeBalanceChange(operations) - nativeFeesPaidBy(CELO_HOLDER, operations)).toBe(
      balances[0].value,
    );
  }, 120000);

  it("lists CELO once, as native, beside the other tokens", async () => {
    const [balances, { items }] = await Promise.all([
      api.getBalance(context, CELO_HOLDER),
      api.listOperations(context, CELO_HOLDER, { minHeight: 0 }),
    ]);

    for (const assets of [balances, items]) {
      expect(assets.some(({ asset }) => isGoldToken(asset))).toBe(false);
      expect(assets.some(({ asset }) => asset.type === "erc20")).toBe(true);
    }
    expect(balances.filter(({ asset, stake }) => isNative(asset) && !stake)).toHaveLength(1);
  }, 60000);

  it.each([
    {
      transfer: "a GoldToken transfer",
      height: 83560965,
      hash: "0x06f0352421bec662bda62388fc586297e1f48b4084a21d62762097fb67e655f3",
      from: "0x16Aa300b46ca676A6eF84C55c5AD361cBb65C001",
      to: "0xF3c53A1AE758801cEEAf3774572f464451479A66",
      amount: 10000000000000000000n,
    },
    {
      transfer: "a native transfer",
      height: 83566408,
      hash: "0xb3c35d00e11eeca8a5307cab7db0421ac3ad529719f274eb4e486f17254735b0",
      from: "0x12775d143747BFF652365386686cA2cE501e8902",
      to: "0xD2dF06bE918DDA76BE9f6993bbeD05Be28BC938a",
      amount: 980378116891000000n,
    },
  ])(
    "reports $transfer as native in getBlock",
    async ({ height, hash, from, to, amount }) => {
      const block = await api.getBlock(context, height);

      const transaction = block.transactions.find(tx => tx.hash === hash);
      expect(transaction?.operations).toEqual(transferLegs(from, to, CELO, amount));
    },
    60000,
  );

  describe("with a swap of GoldToken for USDT that pays its fee in USDT", () => {
    const payer = "0xD4017De5b810a8BB9043FD3F970C7E6b86eE89E4";
    const router = "0xaD6Cea45f98444a922a2b4fE96b8C90F0862D2F4";
    const routerFeeCollector = "0x96CE844A64A0FA4B19B44a6a1b9AA1AA78B662Ee";
    const pool = "0x6cde5f5a192fBf3fD84df983aa6DC30dbd9f8Fac";
    const height = 83568642;
    const hash = "0xf6449ca9cc6a53e13f38f2f243fef02730b1e1f7d11cbf1981f3725a1a46fc40";
    const celoSold = 363908681303808279n;
    const usdtBought = 20075n;
    const usdtFee = { fees: 2979n, feesAsset: USDT, feesPayer: payer };

    it("reports every CELO and USDT move in getBlock, and the fee apart", async () => {
      const block = await api.getBlock(context, height);

      const transaction = block.transactions.find(tx => tx.hash === hash);
      expect(transaction).toMatchObject(usdtFee);
      expect(transaction?.operations).toEqual([
        ...transferLegs(payer, router, CELO, celoSold),
        ...transferLegs(pool, router, USDT, 20175n),
        ...transferLegs(router, pool, CELO, celoSold),
        ...transferLegs(router, routerFeeCollector, USDT, 100n),
        ...transferLegs(router, payer, USDT, usdtBought),
      ]);
    }, 60000);

    it("reports the payer's CELO and USDT moves in listOperations, and the fee apart", async () => {
      const { items } = await api.listOperations(context, payer, {
        minHeight: height,
        order: "asc",
        limit: 10,
      });

      expect(items.filter(({ tx }) => tx.hash === hash)).toMatchObject([
        { type: "OUT", value: celoSold, asset: CELO, tx: usdtFee },
        { type: "IN", value: usdtBought, asset: USDT, tx: usdtFee },
      ]);
    }, 60000);
  });
});
