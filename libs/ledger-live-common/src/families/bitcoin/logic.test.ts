import { $Shape } from "utility-types";
import { mapTxToOperations } from "./logic";
import { TX } from "./wallet-btc";
import type { Operation } from "@ledgerhq/types-live";

describe("mapTxToOperations", () => {
  it("should filter out outputs that have unknown in their address", () => {
    const ops: $Shape<Operation[]> = mapTxToOperations(
      {
        outputs: [
          {
            address: "lelunknownaddress",
          },
        ],
        inputs: [],
      } as unknown as TX,
      "bitcoin",
      "accountId",
      new Set(["myaddress"]),
      new Set(["address"]),
    );
    expect(ops.length).toEqual(0);
  });

  it("should filter out outputs that have no address", () => {
    const ops: $Shape<Operation[]> = mapTxToOperations(
      {
        outputs: [{}],
        inputs: [],
      } as unknown as TX,
      "bitcoin",
      "accountId",
      new Set(["myaddress"]),
      new Set(["address"]),
    );
    expect(ops.length).toEqual(0);
  });

  it("shouldn't filter out outputs with address", () => {
    const ops: $Shape<Operation[]> = mapTxToOperations(
      {
        outputs: [
          {
            address: "myaddress",
          },
        ],
        inputs: [],
      } as unknown as TX,
      "bitcoin",
      "accountId",
      new Set(["myaddress"]),
      new Set(["address"]),
    );
    expect(ops.length).toEqual(1);
  });
});
