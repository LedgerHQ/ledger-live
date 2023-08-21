import { mapTxToOperations } from "./logic";
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
          },
        ],
        inputs: [],
      } as unknown as TX,
      "bitcoin",
      "accountId",
      new Set(["myAddress"]),
      new Set(["changeAddress"]),
    );
    expect(ops.length).toEqual(1);
  });
});
