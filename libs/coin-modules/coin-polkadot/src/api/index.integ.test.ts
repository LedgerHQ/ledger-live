import type { CoinModuleApi, Operation } from "@ledgerhq/coin-module-framework/api/index";
import { withDefaults } from "@ledgerhq/coin-module-framework/api/index";
import coinConfig, { type PolkadotCoinConfig } from "../config";
import { createMockPolkadotContext } from "../test/config.fixture";
import { createApi } from ".";
import { ApiPromise, HttpProvider, Keyring } from "@polkadot/api";
import { type ProviderInterface } from "@polkadot/rpc-provider/types";
import { cryptoWaitReady, encodeAddress, hdLedger, mnemonicGenerate } from "@polkadot/util-crypto";

describe("Polkadot Api", () => {
  let module: CoinModuleApi<PolkadotCoinConfig>;
  const mainnetConfig: PolkadotCoinConfig = {
    status: { type: "active" },
    node: {
      url: "https://polkadot-asset-hub-fullnodes.api.live.ledger.com",
    },
    sidecar: {
      url: "https://polkadot-mainnet-rest-api.coin.ledger.com/v1",
    },
    indexer: {
      url: "https://explorers.api.live.ledger.com/blockchain/dot_asset_hub",
    },
  };
  const context = createMockPolkadotContext(mainnetConfig);
  const address = "144HGaYrSdK3543bi26vT6Rd8Bg7pLPMipJNr2WLc3NuHgD2";

  beforeAll(() => {
    // The api/logic layers still resolve config through the getCoinConfig() singleton, so seed it.
    coinConfig.setCoinConfig(() => mainnetConfig);
    module = withDefaults(createApi());
  });

  describe("estimateFees", () => {
    it("returns a default value", async () => {
      // Given
      const amount = BigInt(100);

      // When
      const { value } = await module.estimateFees(context, {
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: address,
        recipient: "address",
        amount,
      });

      expect(value).toBeGreaterThanOrEqual(BigInt(1));
    });
  });

  describe("listOperations", () => {
    it.skip("returns a list regarding address parameter", async () => {
      // When
      const { items: tx } = await module.listOperations(context, address, {
        minHeight: 0,
        order: "asc",
      });

      // Then
      expect(tx.length).toBeGreaterThanOrEqual(1);
      tx.forEach((operation: Operation) => {
        expect(operation.senders.concat(operation.recipients)).toContainEqual(address);
      });
    }, 20000);

    it.skip("returns all operations", async () => {
      // When
      const { items: tx } = await module.listOperations(context, address, {
        minHeight: 0,
        order: "asc",
      });

      // Then
      const checkSet = new Set(tx.map((elt: Operation) => elt.tx.hash));
      expect(checkSet.size).toEqual(tx.length);
    });
  });

  describe("lastBlock", () => {
    it("returns last block info", async () => {
      // When
      const result = await module.lastBlock(context);

      // Then
      expect(result.hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(result.height).toBeGreaterThan(0);
      expect(result.time).toBeInstanceOf(Date);
    });
  });

  describe("getBalance", () => {
    it("should fetch balance", async () => {
      // When
      const result = await module.getBalance(context, address);

      // Then
      expect(result[0].asset).toEqual({ type: "native" });
      expect(result[0].value).toBeGreaterThan(0);
    }, 10000);
  });

  describe("broadcast", () => {
    it("should throw an error if the transaction is not valid", async () => {
      const senderSeed = mnemonicGenerate(24);
      const receiverSeed = mnemonicGenerate(24);

      const senderKeyPair = hdLedger(senderSeed, "m/44'/354'/0'/0'/0'");
      const receiverKeyPair = hdLedger(receiverSeed, "m/44'/354'/0'/0'/0'");

      const receiverAddress = encodeAddress(receiverKeyPair.publicKey, 0);

      await cryptoWaitReady();

      const provider = new HttpProvider("https://polkadot-asset-hub-fullnodes.api.live.ledger.com");
      const api = await ApiPromise.create({
        provider: provider as ProviderInterface,
        noInitWarn: true,
      });

      try {
        const signerPair = new Keyring().addFromPair(senderKeyPair);
        const signedTx = await api.tx.balances
          .transferKeepAlive(receiverAddress, 15_000_000_000n)
          .signAsync(signerPair, { nonce: 0 });

        await expect(module.broadcast(context, signedTx.toHex())).rejects.toThrow(
          /FundsUnavailable/,
        );
      } finally {
        await api.disconnect();
      }
    });
  });

  describe("craftTransaction", () => {
    it("returns a raw transaction", async () => {
      // When
      const result = await module.craftTransaction(context, {
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: address,
        recipient: "16YreVmGhM8mNMqnsvK7rn7b1e4SKYsTfFUn4UfCZ65BgDjh",
        amount: BigInt(10),
      });

      // Then
      expect(result).toEqual({
        transaction:
          "0x94040a0300f578e65647d6c76b4d05a74e6c2d33d87f32d8d16959400b38ab97d758eb061928",
      });
    });
  });
});
