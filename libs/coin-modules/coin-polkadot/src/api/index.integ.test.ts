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
        url: "https://api.zondax.ch/polkadot/transaction/metadata",
      },
      metadataHash: {
        url: "https://api.zondax.ch/polkadot/node/metadata/hash",
      },
      runtimeUpgraded: false,
    });
  });

  describe("estimateFees", () => {
    it("returns a default value", async () => {
      // Given
      const amount = BigInt(100);

      // When
      const result = await module.estimateFees(address, amount);

      // Then
      expect(result).toEqual(BigInt(154107779));
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
    });
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
    });
  });

  describe("craftTransaction", () => {
    it("returns a raw transaction", async () => {
      // When
      const result = await module.craftTransaction(address, {
        recipient: "16YreVmGhM8mNMqnsvK7rn7b1e4SKYsTfFUn4UfCZ65BgDjh",
        amount: BigInt(10),
        fee: BigInt(1),
      });

      // Then
      expect(result).toEqual(
        "6c0053ddb3b3a89ed5c8d8326066032beac6de225c9e010300000a0000a31e81ac3425310e3274a4698a793b2839dc0afa00",
      );
    });
  });
});
