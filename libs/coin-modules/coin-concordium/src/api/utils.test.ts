import type { RawOperation } from "../types";
import { mapRawOperationToApiOperation } from "./utils";

function createRawOperation(overrides?: Partial<RawOperation>): RawOperation {
  return {
    hash: "aa".repeat(32),
    type: "OUT",
    sender: "3a9gh23nNY3kH4k3ajaCqAbM8rcbWMor2VhEzQ6qkn2r17UU7w",
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
    const result = mapRawOperationToApiOperation(raw);

    expect(result.id).toBe(raw.hash);
  });

  it("should map a RawOperation to an API Operation with BigInt values", () => {
    const raw = createRawOperation();
    const result = mapRawOperationToApiOperation(raw);

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
    const result = mapRawOperationToApiOperation(raw);

    expect(result.details?.memo).toBe("hello world");
  });

  it("should not include memo in details when absent", () => {
    const raw = createRawOperation({ memo: undefined });
    const result = mapRawOperationToApiOperation(raw);

    expect(result.details?.memo).toBeUndefined();
  });

  it("should include pagingToken in details", () => {
    const raw = createRawOperation({ id: 77 });
    const result = mapRawOperationToApiOperation(raw);

    expect(result.details?.pagingToken).toBe("77");
  });

  it("should use empty string as block hash when blockHash is null", () => {
    const raw = createRawOperation({ blockHash: null });
    const result = mapRawOperationToApiOperation(raw);

    expect(result.tx.block.hash).toBe("");
  });

  it("should map IN operations correctly", () => {
    const raw = createRawOperation({ type: "IN", value: "2000000", fee: "0" });
    const result = mapRawOperationToApiOperation(raw);

    expect(result.type).toBe("IN");
    expect(result.value).toBe(BigInt(2000000));
  });

  it("should mark failed transactions", () => {
    const raw = createRawOperation({ failed: true });
    const result = mapRawOperationToApiOperation(raw);

    expect(result.tx.failed).toBe(true);
  });
});
