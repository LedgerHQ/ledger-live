import { mapTxToOperations, inferTransactionSequenceNumberFromInputs } from "./logic";
import { TX } from "./wallet-btc";

describe("mapTxToOperations", () => {
  it("should filter out outputs that have unknown in their address", () => {
    const ops = mapTxToOperations(
      {
        outputs: [
          {
            address: "<unknown>",
          },
        ],
        inputs: [],
      } as unknown as TX,
      "bitcoin",
      "accountId",
      new Set(["myAddress"]),
      new Set(["changeAddress"]),
    );
    expect(ops.length).toEqual(0);
  });

  it("should filter out outputs that have no address", () => {
    const ops = mapTxToOperations(
      {
        outputs: [{}],
        inputs: [],
      } as unknown as TX,
      "bitcoin",
      "accountId",
      new Set(["myAddress"]),
      new Set(["changeAddress"]),
    );
    expect(ops.length).toEqual(0);
  });

  it("shouldn't filter out outputs with address", () => {
    const ops = mapTxToOperations(
      {
        outputs: [
          {
            address: "myAddress",
            value: 1000,
          },
        ],
        inputs: [],
        received_at: new Date().toISOString(),
      } as unknown as TX,
      "bitcoin",
      "accountId",
      new Set(["myAddress"]),
      new Set(["changeAddress"]),
    );
    expect(ops.length).toEqual(1);
    expect(ops[0]?.type).toBe("IN");
  });

  it("should set transactionSequenceNumber when input sequence is defined and non-zero", () => {
    const ops = mapTxToOperations(
      {
        outputs: [],
        inputs: [
          {
            address: "inputAddr",
            value: 1000,
            sequence: 4294967293,
            output_hash: "abc",
            output_index: 0,
          },
        ],
        received_at: new Date().toISOString(),
      } as unknown as TX,
      "bitcoin",
      "accountId",
      new Set(["inputAddr"]),
      new Set(),
    );

    expect(ops.length).toBe(1);
    expect(ops[0]?.transactionSequenceNumber).toBe(4294967293);
  });

  it("should retain transactionSequenceNumber = 0 when explicitly set", () => {
    const ops = mapTxToOperations(
      {
        outputs: [],
        inputs: [
          {
            address: "inputAddr",
            value: 1000,
            sequence: 0,
            output_hash: "abc",
            output_index: 0,
          },
        ],
        received_at: new Date().toISOString(),
      } as unknown as TX,
      "bitcoin",
      "accountId",
      new Set(["inputAddr"]),
      new Set(),
    );

    expect(ops.length).toBe(1);
    expect(ops[0]?.transactionSequenceNumber).toBe(0); // important: not undefined
  });

  it("should set transactionSequenceNumber to undefined when sequence is missing", () => {
    const ops = mapTxToOperations(
      {
        outputs: [],
        inputs: [
          {
            address: "inputAddr",
            value: 1000,
            output_hash: "abc",
            output_index: 0,
            // no sequence
          },
        ],
        received_at: new Date().toISOString(),
      } as unknown as TX,
      "bitcoin",
      "accountId",
      new Set(["inputAddr"]),
      new Set(),
    );

    expect(ops.length).toBe(1);
    // missing sequence implies 0xfffffffe (default)"
    expect(ops[0]?.transactionSequenceNumber).toBe(0xfffffffe);
  });
});

describe("inferTransactionSequenceNumberFromInputs", () => {
  it("returns undefined if no account inputs are provided", () => {
    const result = inferTransactionSequenceNumberFromInputs([]);
    expect(result).toBeUndefined();
  });

  it("returns exact sequence when all inputs have defined sequence", () => {
    const result = inferTransactionSequenceNumberFromInputs([
      { sequence: 0xfffffffe },
      { sequence: 0xfffffffd },
    ]);
    expect(result).toBe(0xfffffffd);
  });

  it("falls back to 0xfffffffe when some inputs are missing sequence", () => {
    const result = inferTransactionSequenceNumberFromInputs([
      { sequence: 0xfffffffd },
      {}, // missing sequence
    ]);
    expect(result).toBe(0xfffffffd);
  });

  it("defaults entirely to 0xfffffffe when all inputs are missing sequence", () => {
    const result = inferTransactionSequenceNumberFromInputs([{}, {}]);
    expect(result).toBe(0xfffffffe);
  });

  it("returns 0 when one of the sequences is explicitly 0", () => {
    const result = inferTransactionSequenceNumberFromInputs([{ sequence: 0 }, { sequence: 1 }]);
    expect(result).toBe(0);
  });
});
