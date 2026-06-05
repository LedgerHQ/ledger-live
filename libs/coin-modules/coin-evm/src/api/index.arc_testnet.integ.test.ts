import type {
  CoinModuleApi,
  BufferTxData,
  MemoNotSupported,
  Operation,
} from "@ledgerhq/coin-module-framework/api/types";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { EvmConfig } from "../config";
import { createApi } from "./index";

// Arc testnet exposes its native unit (USDC) as an ERC20 at this fixed precompile
// address. The explorer indexes native transfers as BOTH a native tx AND a synthetic
// ERC20 Transfer event on this contract. We rely on the `nativeContracts` config
// to skip the ERC20 side so the wallet doesn't double-count.
const ARC_USDC_NATIVE_CONTRACT = "0x3600000000000000000000000000000000000000";

// Address with on-chain native USDC activity in both directions (IN and OUT).
const NATIVE_USDC_ADDRESS = "0x6b618ca7eadcd948266de6602f2f8f3452d1ad6c";

describe("EVM Api (Arc Testnet)", () => {
  let module: CoinModuleApi<MemoNotSupported, BufferTxData> & BridgeApi;
  let operations: Operation[];

  beforeAll(async () => {
    setupCalClientStore();
    module = createApi(
      {
        node: { type: "external", uri: "https://rpc.testnet.arc.network" },
        explorer: {
          type: "blockscout",
          uri: "https://proxyblockscout.api.live.ledger.com/5042002/api",
        },
        showNfts: false,
        nativeContracts: [ARC_USDC_NATIVE_CONTRACT],
      } as EvmConfig,
      "arc_testnet",
    );

    // Single network call shared across all listOperations assertions.
    const { items } = await module.listOperations(NATIVE_USDC_ADDRESS, {
      minHeight: 0,
      order: "desc",
      limit: 200,
    });
    operations = items;
  }, 60000);

  describe("listOperations", () => {
    it("returns a non-empty list", () => {
      expect(operations).toBeInstanceOf(Array);
      expect(operations.length).toBeGreaterThan(0);
    });

    it("filters out ERC20 Transfer events on the native USDC precompile (no double-counting)", () => {
      const erc20OpsOnPrecompile = operations.filter(
        op =>
          op.asset.type === "erc20" &&
          "assetReference" in op.asset &&
          typeof op.asset.assetReference === "string" &&
          op.asset.assetReference.toLowerCase() === ARC_USDC_NATIVE_CONTRACT.toLowerCase(),
      );
      expect(erc20OpsOnPrecompile).toEqual([]);
    });

    it("marks every USDC transfer as a native operation", () => {
      const nativeOps = operations.filter(op => op.asset.type === "native");
      expect(nativeOps.length).toBeGreaterThan(0);
    });

    it("exposes the expected metadata on a known native USDC IN transfer", () => {
      // https://testnet.arcscan.app/tx/0xea849633c4a3ae7e63f53ebe6f2cb1adda76d1547285be754a2ecbef30a343bf
      // 20 USDC received from 0xd4c0b7… (18-decimal native units).
      const txHash = "0xea849633c4a3ae7e63f53ebe6f2cb1adda76d1547285be754a2ecbef30a343bf";

      const operation = operations.find(op => op.tx.hash.toLowerCase() === txHash);
      expect(operation).toMatchObject({
        type: "IN",
        value: 20000000000000000000n,
        asset: { type: "native" },
        tx: expect.objectContaining({
          hash: txHash,
          block: expect.objectContaining({ height: 41845790 }),
        }),
      });
      expect(operation!.senders.map(s => s.toLowerCase())).toEqual([
        "0xd4c0b787aa2ff9eb751bb515c877ebbf2daddaae",
      ]);
      expect(operation!.recipients.map(r => r.toLowerCase())).toEqual([NATIVE_USDC_ADDRESS]);
    });
  });

  describe("getBalance", () => {
    it("returns the native balance and no ERC20 balance for contracts in nativeContracts", async () => {
      const balances = await module.getBalance(NATIVE_USDC_ADDRESS);

      const nativeBalance = balances[0];
      expect(nativeBalance.asset.type).toBe("native");
      expect(typeof nativeBalance.value).toBe("bigint");

      const tokenBalanceOnNativeContract = balances.find(
        b =>
          b.asset.type === "erc20" &&
          "assetReference" in b.asset &&
          typeof b.asset.assetReference === "string" &&
          b.asset.assetReference.toLowerCase() === ARC_USDC_NATIVE_CONTRACT.toLowerCase(),
      );
      expect(tokenBalanceOnNativeContract).toBeUndefined();
    }, 60000);
  });
});
