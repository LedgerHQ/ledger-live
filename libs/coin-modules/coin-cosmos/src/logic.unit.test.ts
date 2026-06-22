import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import BigNumber from "bignumber.js";
import { mapUnbondings } from "./logic";
import type { CosmosUnbonding } from "./types";

const unit = getCryptoCurrencyById("cosmos").units[0];

const buildUnbonding = (validatorAddress: string, completionDate: string): CosmosUnbonding => ({
  validatorAddress,
  amount: new BigNumber(1000),
  completionDate: new Date(completionDate),
});

describe("mapUnbondings", () => {
  it("should not throw when unbondings input is frozen", () => {
    const unbondings = [
      buildUnbonding("validator-2", "2024-01-02T00:00:00.000Z"),
      buildUnbonding("validator-1", "2024-01-01T00:00:00.000Z"),
    ];
    Object.freeze(unbondings);

    expect(() => mapUnbondings(unbondings, [], unit)).not.toThrow();
  });

  it("should not mutate the original unbondings order", () => {
    const unbondings = [
      buildUnbonding("validator-2", "2024-01-02T00:00:00.000Z"),
      buildUnbonding("validator-1", "2024-01-01T00:00:00.000Z"),
    ];

    const result = mapUnbondings(unbondings, [], unit);

    expect(unbondings.map(({ validatorAddress }) => validatorAddress)).toEqual([
      "validator-2",
      "validator-1",
    ]);
    expect(result.map(({ validatorAddress }) => validatorAddress)).toEqual([
      "validator-1",
      "validator-2",
    ]);
  });
});
