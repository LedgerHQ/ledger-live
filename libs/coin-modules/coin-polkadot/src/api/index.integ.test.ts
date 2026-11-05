import type { CoinModuleApi, Operation } from "@ledgerhq/coin-module-framework/api/index";
import { withDefaults } from "@ledgerhq/coin-module-framework/api/index";
import type { PolkadotCoinConfig } from "../config";
import { createMockPolkadotContext } from "../test/config.fixture";
import { createApi } from ".";
import { ApiPromise, HttpProvider, Keyring } from "@polkadot/api";
import { type ProviderInterface } from "@polkadot/rpc-provider/types";
import { cryptoWaitReady, encodeAddress, hdLedger, mnemonicGenerate } from "@polkadot/util-crypto";

describe("Polkadot Api", () => {
  let module: CoinModuleApi<PolkadotCoinConfig>;
  const mainnetConfig: PolkadotCoinConfig = {
    status: { type: "active" },
    name: "Polkadot",
    unit: { name: "DOT", code: "DOT", magnitude: 10 },
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
    module = withDefaults(createApi("polkadot"));
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

  describe("getBlock", () => {
    it("returns a block with its transfers and fees", async () => {
      const block = await module.getBlock(context, 22653132);

      expect(block.info).toEqual({
        height: 22653132,
        hash: "0xdfb85c23d2f195e70e87418cb8d3889b1a5a7cb22d46447b6c5d40b9b7eae1fc",
        time: new Date(1793704368000),
        parent: {
          height: 22653131,
          hash: "0xcfd1fab61599d8545e3f74f127fcd05ebfba9ec374ddf6bb227ae8b123d06ec1",
        },
      });
      expect(block.transactions).toContainEqual({
        hash: "0x36e4a2ce49d2a2aeff288dfdfd91c9c3ab8d66ec361b72a6b7eb7935569c18cb",
        failed: false,
        operations: [
          {
            type: "transfer",
            address: "12burmzVh1dCeZ9KRUV6Pmtabg9MNBNkCh9K7pbzV8dV7xrf",
            peer: "16QX2GpD4o5FE1bTobpPq7qJYER6rosUbo732jLQtFxfZwAQ",
            asset: { type: "native" },
            amount: -10000000n,
          },
          {
            type: "transfer",
            address: "16QX2GpD4o5FE1bTobpPq7qJYER6rosUbo732jLQtFxfZwAQ",
            peer: "12burmzVh1dCeZ9KRUV6Pmtabg9MNBNkCh9K7pbzV8dV7xrf",
            asset: { type: "native" },
            amount: 10000000n,
          },
        ],
        fees: 8808355n,
        feesPayer: "12burmzVh1dCeZ9KRUV6Pmtabg9MNBNkCh9K7pbzV8dV7xrf",
        details: { palletMethod: "balances.transferKeepAlive" },
      });
    });

    it("returns the latest block", async () => {
      const { height, hash } = await module.lastBlock(context);

      const { info } = await module.getBlock(context, height);

      expect(info).toMatchObject({ height, hash });
    });

    it("rejects a block that does not exist yet", async () => {
      await expect(module.getBlock(context, Number.MAX_SAFE_INTEGER)).rejects.toThrow(/not found/);
    });
  });

  describe("getBlockInfo", () => {
    it("returns the block info with its timestamp and parent", async () => {
      const info = await module.getBlockInfo(context, 22653132);

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

    it("rejects a block that does not exist yet", async () => {
      await expect(module.getBlockInfo(context, Number.MAX_SAFE_INTEGER)).rejects.toThrow(
        /not found/,
      );
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
