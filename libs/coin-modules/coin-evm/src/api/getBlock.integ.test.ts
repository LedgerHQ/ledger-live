import { Api, BufferTxData, MemoNotSupported } from "@ledgerhq/coin-framework/api/types";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { EvmConfig } from "../config";
import { createApi } from "./index";

/**
 * Integration tests for getBlock API method with ERC20 transfers
 *
 * These tests verify that ERC20 transfers are correctly extracted from:
 * 1. External RPC nodes (via eth_getTransactionReceipt logs) - Velas EVM
 * 2. Ledger explorer API (via transfer_events) - BSC
 */

describe("getBlock ERC20 transfers", () => {
  beforeAll(() => {
    setupCalClientStore();
  });

  describe("External RPC Node (Velas EVM)", () => {
    // Real data from Velas EVM:
    // - Block: 69733298
    // - TX: 0x23f9232e929f9a13f4f2d6d4e9bf27d717a2b1250d207c030fc66565c4e205e1
    // - Contains ERC20 transfer of token 0xabf26902fd7b624e0db40d31171ea9dddf078351
    // - From: 0x534eeF6Db44FBeB71047EE3eb4CB16E572862aF6
    // - To: 0x970402B253733A1f6F4f3cd1d07420006be2882D

    let module: Api<MemoNotSupported, BufferTxData>;

    beforeAll(() => {
      const velasEvmConfig: EvmConfig = {
        node: {
          type: "external",
          uri: "https://evmexplorer.velas.com/rpc",
        },
        explorer: {
          type: "blockscout",
          uri: "https://evmexplorer.velas.com/api",
        },
      };
      module = createApi(velasEvmConfig, "velas_evm");
    });

    it("should return ERC20 transfer operations from block 69733298", async () => {
      const expectedAsset = {
        type: "erc20",
        assetReference: "0xaBf26902Fd7B624e0db40D31171eA9ddDf078351", // EIP-55 checksummed
      };
      const expectedAmount = 742832320000000000000000n;

      const block = await module.getBlock(69733298);

      // Verify block info
      expect(block.info.height).toBe(69733298);
      expect(block.info.hash).toBe(
        "0x54eab648119283f9d0fa903a36b7e67db69f1fbc267af8ebc5390cfbbe7bd6e0",
      );

      // Find the transaction with ERC20 transfer
      const tx = block.transactions.find(
        t => t.hash === "0x23f9232e929f9a13f4f2d6d4e9bf27d717a2b1250d207c030fc66565c4e205e1",
      );
      expect(tx).toBeDefined();

      // Find ERC20 transfer operation for the expected token
      const tokenOps = tx!.operations.filter(
        op =>
          op.type === "transfer" &&
          op.asset.type === expectedAsset.type &&
          op.asset.assetReference === expectedAsset.assetReference,
      );
      // there are two transfer operations for the expected token,
      // one positive and one negative depending on the direction of the transfer
      expect(tokenOps).toHaveLength(2);
      expect(tokenOps.map(op => op.amount).sort()).toEqual([-expectedAmount, expectedAmount]);
    });
  });

  describe("Ledger Explorer API (BSC)", () => {
    // Real data from BSC:
    // - Block: 18821112
    // - TX: 0x4f5c5d2dd2c36da64401aa654fd92db9d1ddcf2fedba6428f5f9eb7075a2fa78
    // - Address: 0xcc4461636684868AaB71037b29a11cC643E64500
    // - Token: 0xF68C9Df95a18B2A5a5fa1124d79EEEffBaD0B6Fa

    let module: Api<MemoNotSupported, BufferTxData>;

    beforeAll(() => {
      const bscConfig: EvmConfig = {
        node: {
          type: "ledger",
          explorerId: "bnb",
        },
        explorer: {
          type: "ledger",
          explorerId: "bnb",
        },
      };
      module = createApi(bscConfig, "bsc");
    });

    it("should return ERC20 transfer operations from block 18821112", async () => {
      const expectedAsset = {
        type: "erc20",
        assetReference: "0xF68C9Df95a18B2A5a5fa1124d79EEEffBaD0B6Fa", // EIP-55 checksummed
      };
      const expectedAmount = 20000000000000000000000n;

      const block = await module.getBlock(18821112);

      // Verify block info
      expect(block.info.height).toBe(18821112);
      expect(block.info.hash).toBe(
        "0x9c00dca3e674b19d4485432616e7140ef9099ad451d41eae28727a3278daf914",
      );

      // Find the transaction with ERC20 transfer
      const tx = block.transactions.find(
        t => t.hash === "0x4f5c5d2dd2c36da64401aa654fd92db9d1ddcf2fedba6428f5f9eb7075a2fa78",
      );
      expect(tx).toBeDefined();

      // Find ERC20 transfer operation for the expected token
      const tokenOps = tx!.operations.filter(
        op =>
          op.type === "transfer" &&
          op.asset.type === expectedAsset.type &&
          op.asset.assetReference === expectedAsset.assetReference,
      );
      // there are two transfer operations for the expected token,
      // one positive and one negative depending on the direction of the transfer
      expect(tokenOps).toHaveLength(2);
      expect(tokenOps.map(op => op.amount).sort()).toEqual([-expectedAmount, expectedAmount]);
    });
  });
});
