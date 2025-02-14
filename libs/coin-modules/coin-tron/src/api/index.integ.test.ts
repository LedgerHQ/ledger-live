import { type Api } from "@ledgerhq/coin-framework/api/index";
import { createApi } from ".";
/**
 * https://api.shasta.trongrid.io
 */
describe("Tron Api", () => {
  let module: Api;
  // const address = "tz1heMGVHQnx7ALDcDKqez8fan64Eyicw4DJ";

  beforeAll(() => {
    module = createApi({
      explorer: {
        url: "https://api.shasta.trongrid.io",
      },
    });
  });

  describe("broadcast", () => {
    it.skip("returns tx id", async () => {
      // When
      const result = await module.broadcast("");

      // Then
      expect(result).toBeUndefined();
    });

    //TODO: Find a generic way
    it("throws an error due to transaction expired", async () => {
      // When
      const promise = module.broadcast(
        "0A8A010A0202DB2208C89D4811359A28004098A4E0A6B52D5A730802126F0A32747970652E676F6F676C65617069732E636F6D2F70726F746F636F6C2E5472616E736665724173736574436F6E747261637412390A07313030303030311215415A523B449890854C8FC460AB602DF9F31FE4293F1A15416B0580DA195542DDABE288FEC436C7D5AF769D24206412418BF3F2E492ED443607910EA9EF0A7EF79728DAAAAC0EE2BA6CB87DA38366DF9AC4ADE54B2912C1DEB0EE6666B86A07A6C7DF68F1F9DA171EEE6A370B3CA9CBBB00",
      );

      // Then
      expect(promise).rejects.toThrow();
    });
  });

  describe("getBalance", () => {
    it("returns correct value", async () => {
      // When
      const result = await module.getBalance("TBiqVrKkzbvCkrtUUV2YLX1tJAFudoJx3X");

      // Then
      // expect(typeof result).not.toBe("bigint");
      if (typeof result === "bigint") {
        throw new Error("Should not be a bigint");
      }
      expect(result).toEqual({
        native: expect.any(BigInt),
        tokens: [
          {
            balance: expect.any(BigInt),
            contractAddress: "TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs",
            standard: "trc20",
          },
        ],
      });
      expect(result.native).toBeGreaterThan(0n);
      // (result as AssetTree).tokens.forEach(token => expect(token.balance).toBeGreaterThan(0n));
    });
  });
});
