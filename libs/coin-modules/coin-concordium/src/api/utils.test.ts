import type { RawOperation } from "../types";
import { mapRawOperationToApiOperation } from "./utils";

const ADDRESS = "3a9gh23nNY3kH4k3ajaCqAbM8rcbWMor2VhEzQ6qkn2r17UU7w";

function createRawOperation(overrides?: Partial<RawOperation>): RawOperation {
  return {
    hash: "aa".repeat(32),
    type: "OUT",
    sender: ADDRESS,
    recipient: "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G",
    amount: "1000000",
    fee: "500",
    value: "1000500",
    memo: undefined,
    date: new Date("2024-06-01T00:00:00Z"),
    blockHash: "bbcc",
    blockHeight: 500,
    failed: false,
    id: 42,
    ...overrides,
  };
}

describe("mapRawOperationToApiOperation", () => {
  it("should use tx hash as operation id", () => {
    const raw = createRawOperation();
    const result = mapRawOperationToApiOperation(raw, ADDRESS);

    expect(result.id).toBe(raw.hash);
  });

  it("should map a RawOperation to an API Operation with BigInt values", () => {
    const raw = createRawOperation();
    const result = mapRawOperationToApiOperation(raw, ADDRESS);

    expect(result.tx.block.height).toBe(500);

    expect(result.value).toBe(BigInt(1000500));
    expect(result.tx.fees).toBe(BigInt(500));
    expect(result.type).toBe("OUT");
    expect(result.senders).toEqual([raw.sender]);
    expect(result.recipients).toEqual([raw.recipient]);
    expect(result.tx.hash).toBe(raw.hash);
    expect(result.tx.failed).toBe(false);
    expect(result.asset).toEqual({ type: "native" });
  });

  it("should include memo in details when present", () => {
    const raw = createRawOperation({ memo: "hello world" });
    const result = mapRawOperationToApiOperation(raw, ADDRESS);

    expect(result.details?.memo).toBe("hello world");
  });

  it("should not include memo in details when absent", () => {
    const raw = createRawOperation({ memo: undefined });
    const result = mapRawOperationToApiOperation(raw, ADDRESS);

    expect(result.details?.memo).toBeUndefined();
  });

  it("should include pagingToken in details", () => {
    const raw = createRawOperation({ id: 77 });
    const result = mapRawOperationToApiOperation(raw, ADDRESS);

    expect(result.details?.pagingToken).toBe("77");
  });

  it("should use empty string as block hash when blockHash is null", () => {
    const raw = createRawOperation({ blockHash: null });
    const result = mapRawOperationToApiOperation(raw, ADDRESS);

    expect(result.tx.block.hash).toBe("");
  });

  it("should map IN operations correctly", () => {
    const raw = createRawOperation({ type: "IN", value: "2000000", fee: "0" });
    const result = mapRawOperationToApiOperation(raw, ADDRESS);

    expect(result.type).toBe("IN");
    expect(result.value).toBe(BigInt(2000000));
  });

  it("should mark failed transactions", () => {
    const raw = createRawOperation({ failed: true });
    const result = mapRawOperationToApiOperation(raw, ADDRESS);

    expect(result.tx.failed).toBe(true);
  });

  describe("PLT operations", () => {
    it("reports the token rather than the native asset", () => {
      const raw = createRawOperation({ tokenId: "trUSDT", decimals: 6, value: "3000000" });
      const result = mapRawOperationToApiOperation(raw, ADDRESS);

      expect(result.asset).toEqual({
        type: "plt",
        assetReference: "trUSDT",
        assetOwner: ADDRESS,
      });
      expect(result.value).toBe(BigInt(3000000));
    });

    it("attributes the token to the account being listed, not to the counterparty", () => {
      const raw = createRawOperation({ type: "IN", tokenId: "trUSDT", decimals: 6 });

      expect(mapRawOperationToApiOperation(raw, ADDRESS).asset).toEqual({
        type: "plt",
        assetReference: "trUSDT",
        assetOwner: ADDRESS,
      });
    });

    it("publishes no unit, leaving the token's denomination to the CAL", () => {
      const raw = createRawOperation({ tokenId: "trUSDT", decimals: 6 });

      expect(mapRawOperationToApiOperation(raw, ADDRESS).asset).not.toHaveProperty("unit");
    });

    it("identifies a rejected transfer that carried no denomination", () => {
      const raw = createRawOperation({ tokenId: "trUSDT", failed: true, value: "0" });

      expect(mapRawOperationToApiOperation(raw, ADDRESS).asset).toEqual({
        type: "plt",
        assetReference: "trUSDT",
        assetOwner: ADDRESS,
      });
    });

    it("leaves a CCD operation native", () => {
      expect(mapRawOperationToApiOperation(createRawOperation(), ADDRESS).asset).toEqual({
        type: "native",
      });
    });
  });
});
