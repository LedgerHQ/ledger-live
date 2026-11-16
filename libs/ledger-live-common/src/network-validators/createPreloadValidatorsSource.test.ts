import { NetworkIdSchema } from "@domain/entity-account-descriptor";
import { setCosmosPreloadData } from "@ledgerhq/coin-cosmos/preloadedData";
import type { CosmosValidatorItem } from "../families/cosmos/types";
import { isLedgerValidator } from "./isLedgerValidator";
import {
  createPreloadValidatorsSource,
  fromCosmosValidator,
} from "./createPreloadValidatorsSource";

jest.mock("./isLedgerValidator", () => ({
  isLedgerValidator: jest.fn((_currencyId: string, address: string) => address === "ledgervaloper"),
}));

const signal = new AbortController().signal;

const cosmosValidator: CosmosValidatorItem = {
  validatorAddress: "cosmosvaloper1abc",
  name: "Ledger",
  votingPower: 0.1,
  commission: 0.05,
  estimatedYearlyRewardsRate: 0.12,
  tokens: "1000000",
};

describe("fromCosmosValidator", () => {
  it("maps a preloaded validator", () => {
    expect(fromCosmosValidator(cosmosValidator)).toEqual({
      id: "cosmosvaloper1abc",
      address: "cosmosvaloper1abc",
      name: "Ledger",
      commission: 0.05,
      apy: 0.12,
      totalStaked: "1000000",
    });
  });

  it("flags a Ledger validator", () => {
    expect(fromCosmosValidator(cosmosValidator, true).isLedger).toBe(true);
    expect(fromCosmosValidator(cosmosValidator, false)).not.toHaveProperty("isLedger");
  });

  it("leaves out what the entity would reject", () => {
    expect(
      fromCosmosValidator({
        ...cosmosValidator,
        commission: 2,
        tokens: "1.5",
        estimatedYearlyRewardsRate: -1,
      }),
    ).toEqual({ id: "cosmosvaloper1abc", address: "cosmosvaloper1abc", name: "Ledger" });
  });
});

describe("createPreloadValidatorsSource", () => {
  it("serves the cosmos family only", () => {
    const source = createPreloadValidatorsSource({ prepareCurrency: jest.fn() });
    expect(source.supports(NetworkIdSchema.parse("cosmos"))).toBe(true);
    expect(source.supports(NetworkIdSchema.parse("osmo"))).toBe(true);
    expect(source.supports(NetworkIdSchema.parse("ethereum"))).toBe(false);
    expect(source.supports(NetworkIdSchema.parse("not_a_network"))).toBe(false);
  });

  it("prepares the currency, then reads its preloaded validators", async () => {
    const prepareCurrency = jest.fn(async () => {
      setCosmosPreloadData("osmo", { validators: [cosmosValidator] });
    });
    const source = createPreloadValidatorsSource({ prepareCurrency });
    await expect(source.read(NetworkIdSchema.parse("osmo"), { signal })).resolves.toEqual([
      fromCosmosValidator(cosmosValidator),
    ]);
    expect(prepareCurrency).toHaveBeenCalledWith(expect.objectContaining({ id: "osmo" }));
  });

  it("flags the validator Ledger runs", async () => {
    const ledgerValidator = { ...cosmosValidator, validatorAddress: "ledgervaloper" };
    const source = createPreloadValidatorsSource({
      prepareCurrency: async () => {
        setCosmosPreloadData("cosmos", { validators: [cosmosValidator, ledgerValidator] });
      },
    });
    const validators = await source.read(NetworkIdSchema.parse("cosmos"), { signal });
    expect(validators.map(({ isLedger }) => isLedger)).toEqual([undefined, true]);
    expect(isLedgerValidator).toHaveBeenCalledWith("cosmos", "ledgervaloper");
  });

  it("fails when the preload left no validator, or failed", async () => {
    const empty = createPreloadValidatorsSource({ prepareCurrency: async () => undefined });
    await expect(empty.read(NetworkIdSchema.parse("axelar"), { signal })).rejects.toThrow(
      "No preloaded validators for axelar",
    );
    const failing = createPreloadValidatorsSource({
      prepareCurrency: () => Promise.reject(new Error("down")),
    });
    await expect(failing.read(NetworkIdSchema.parse("cosmos"), { signal })).rejects.toThrow("down");
  });
});
