import type { Api } from "@ledgerhq/coin-framework/api/index";
import { createApi } from ".";

describe("Stellar Api", () => {
  let module: Api;
  const address = "GD6QELUZPSKPRWVXOQ3F6GBF4OBRMCHO5PHREXH4ZRTPJAG7V5MD7JGX";

  beforeAll(() => {
    module = createApi({
      explorer: {
        url: "https://horizon-testnet.stellar.org/",
        fetchLmit: 100,
      },
      useStaticFees: true,
      enableNetworkLogs: false,
    });
  });

  // describe("estimateFees", () => {
  //   it("returns a default value", async () => {
  //     // Given
  //     const address = "rDCyjRD2TcSSGUQpEcEhJGmDWfjPJpuGxu";
  //     const amount = BigInt(100);

  //     // When
  //     const result = await module.estimateFees(address, amount);

  //     // Then
  //     expect(result).toEqual(BigInt(10));
  //   });
  // });

  describe("listOperations", () => {
    it("returns a list regarding address parameter", async () => {
      // When
      const result = await module.listOperations(address, 0);

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

  // describe("craftTransaction", () => {
  //   it("returns a raw transaction", async () => {
  //     // When
  //     const result = await module.craftTransaction(address, {
  //       recipient: "rKRtUG15iBsCQRgrkeUEg5oX4Ae2zWZ89z",
  //       amount: BigInt(10),
  //       fee: BigInt(1),
  //     });

  //     // Then
  //     expect(result.slice(0, 34)).toEqual("120000228000000024001BCDA6201B001F");
  //     expect(result.slice(38)).toEqual(
  //       "61400000000000000A6840000000000000018114CF30F590D7A9067B2604D80D46090FBF342EBE988314CA26FB6B0EF6859436C2037BA0A9913208A59B98",
  //     );
  //   });
  // });
});
