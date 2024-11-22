import type { Api } from "@ledgerhq/coin-framework/api/index";
import { createApi } from ".";

describe("Polkadot Api", () => {
  let module: Api;
  const address = "144HGaYrSdK3543bi26vT6Rd8Bg7pLPMipJNr2WLc3NuHgD2";

  beforeAll(() => {
    module = createApi({
      node: {
        url: "https://polkadot-rpc.publicnode.com",
      },
      sidecar: {
        url: "https://polkadot-sidecar.coin.ledger.com",
      },
      staking: {
        electionStatusThreshold: 25,
      },
      metadataShortener: {
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
      const result = await module.estimateFees(address, amount);

      // Then
      expect(result).toBeGreaterThanOrEqual(BigInt(100000000));
      expect(result).toBeLessThanOrEqual(BigInt(200000000));
    });
  });

  describe("listOperations", () => {
    it("returns a list regarding address parameter", async () => {
      // When
      const result = await module.listOperations(address, 21500219);

      // Then
      expect(result.length).toBeGreaterThanOrEqual(1);
      result.forEach(operation => {
        expect(operation.address).toEqual(address);
        const isSenderOrReceipt =
          operation.senders.includes(address) || operation.recipients.includes(address);
        expect(isSenderOrReceipt).toBeTruthy();
      });
    }, 20000);
  });

  describe("lastBlock", () => {
    it("returns last block info", async () => {
      // When
      const result = await module.lastBlock();

      // Then
      expect(result.hash).toBeDefined();
      expect(result.height).toBeDefined();
      expect(result.time).toBeInstanceOf(Date);
    });
  });

  describe("getBalance", () => {
    it("returns a list regarding address parameter", async () => {
      // When
      const result = await module.getBalance(address);

      // Then
      expect(result).toBeGreaterThan(0);
    }, 10000);
  });

  describe("craftTransaction", () => {
    it("returns a raw transaction", async () => {
      // When
      const result = await module.craftTransaction(address, {
        type: "send",
        recipient: "16YreVmGhM8mNMqnsvK7rn7b1e4SKYsTfFUn4UfCZ65BgDjh",
        amount: BigInt(10),
        fee: BigInt(1),
      });

      // Then
      expect(result).toEqual(
        "0x9404050300f578e65647d6c76b4d05a74e6c2d33d87f32d8d16959400b38ab97d758eb061928",
      );
    });
  });
});
