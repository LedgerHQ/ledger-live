import type { AlpacaApi } from "@ledgerhq/coin-framework/api/index";
import { createApi } from ".";

describe("Polkadot Api", () => {
  let module: AlpacaApi;
  const address = "144HGaYrSdK3543bi26vT6Rd8Bg7pLPMipJNr2WLc3NuHgD2";

  beforeAll(() => {
    module = createApi({
      node: {
        url: "https://polkadot-asset-hub-fullnodes.api.live.ledger.com",
      },
      sidecar: {
        url: "https://polkadot-asset-hub-sidecar.coin.ledger.com",
      },
      indexer: {
        url: "https://explorers.api.live.ledger.com/blockchain/dot_asset_hub",
      },
      staking: {
        electionStatusThreshold: 25,
      },
      metadataShortener: {
        id: "dot-hub",
        url: "https://polkadot-metadata-shortener.api.live.ledger.com/transaction/metadata",
      },
      metadataHash: {
        url: "https://polkadot-metadata-shortener.api.live.ledger.com/node/metadata/hash",
      },
    });
  });

  describe("estimateFees", () => {
    it("returns a default value", async () => {
      // Given
      const amount = BigInt(100);

      // When
      const { value } = await module.estimateFees({
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
      const { items: tx } = await module.listOperations(address, { minHeight: 0, order: "asc" });

      // Then
      expect(tx.length).toBeGreaterThanOrEqual(1);
      tx.forEach(operation => {
        expect(operation.senders.concat(operation.recipients)).toContainEqual(address);
      });
    }, 20000);

    it.skip("returns all operations", async () => {
      // When
      const { items: tx } = await module.listOperations(address, { minHeight: 0, order: "asc" });

      // Then
      const checkSet = new Set(tx.map(elt => elt.tx.hash));
      expect(checkSet.size).toEqual(tx.length);
    });
  });

  describe("lastBlock", () => {
    it("returns last block info", async () => {
      // When
      const result = await module.lastBlock();

      // Then
      expect(result.hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(result.height).toBeGreaterThan(0);
      expect(result.time).toBeInstanceOf(Date);
    });
  });

  describe("getBalance", () => {
    it("should fetch balance", async () => {
      // When
      const result = await module.getBalance(address);

      // Then
      expect(result[0].asset).toEqual({ type: "native" });
      expect(result[0].value).toBeGreaterThan(0);
    }, 10000);
  });

  describe("craftTransaction", () => {
    it("returns a raw transaction", async () => {
      // When
      const result = await module.craftTransaction({
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
