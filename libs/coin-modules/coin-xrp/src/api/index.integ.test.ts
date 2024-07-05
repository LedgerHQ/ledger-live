import type { Api } from "@ledgerhq/coin-framework/api/index";
import { createApi } from ".";

describe("Xrp Api", () => {
  let module: Api;
  beforeAll(() => {
    module = createApi({ node: "https://xrplcluster.com/ledgerlive" });
  });

  describe("estimateFees", () => {
    it("returns a default value", async () => {
      // Given
      const address = "rDCyjRD2TcSSGUQpEcEhJGmDWfjPJpuGxu";
      const amount = BigInt(100);

      // When
      const result = await module.estimateFees(address, amount);

      // Then
      expect(result).toEqual(BigInt(10));
    });
  });

  describe("listOperations", () => {
    it("returns a list regarding address parameter", async () => {
      // Given
      const address = "rDCyjRD2TcSSGUQpEcEhJGmDWfjPJpuGxu";

      // When
      const result = await module.listOperations(address, 0);

      // Then
      expect(result.length).toBeGreaterThanOrEqual(3);
      result.forEach(operation => {
        expect(operation.address).toEqual(address);
        const isSenderOrReceipt =
          operation.senders.includes(address) || operation.recipients.includes(address);
        expect(isSenderOrReceipt).toBeTruthy();
      });
    });
  });

  describe("getBalance", () => {
    it("returns a list regarding address parameter", async () => {
      // Given
      const address = "rDCyjRD2TcSSGUQpEcEhJGmDWfjPJpuGxu";

      // When
      const result = await module.getBalance(address);

      // Then
      expect(result).toBeGreaterThan(0);
    });
  });
});
