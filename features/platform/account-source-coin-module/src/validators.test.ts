import { NetworkIdSchema } from "@domain/entity-account-descriptor";
import {
  CoinModuleValidatorsNotServedError,
  MAX_VALIDATOR_PAGES,
  createCoinModuleValidatorsSource,
  toNetworkValidator,
  type CoinModuleValidator,
  type CoinModuleValidatorsApi,
} from "./validators";

const cosmos = NetworkIdSchema.parse("cosmos");
const signal = new AbortController().signal;

const validator: CoinModuleValidator = {
  id: "cosmosvaloper1abc",
  address: "cosmosvaloper1abc",
  name: "Ledger",
  url: "https://ledger.com",
  logo: "https://ledger.com/logo.png",
  balance: 1_000_000n,
  commissionRate: "0.05",
  apy: 0.12,
};

const sourceWith = (api: CoinModuleValidatorsApi | undefined, supported = true) =>
  createCoinModuleValidatorsSource({
    isCurrencySupported: () => supported,
    getValidatorsApi: async () => api,
  });

describe("toNetworkValidator", () => {
  it("maps a coin module validator", () => {
    expect(toNetworkValidator(validator)).toEqual({
      id: "cosmosvaloper1abc",
      address: "cosmosvaloper1abc",
      name: "Ledger",
      commission: 0.05,
      apy: 0.12,
      totalStaked: "1000000",
      iconUrl: "https://ledger.com/logo.png",
      url: "https://ledger.com",
    });
  });

  it("leaves out the fields the entity would reject, and falls back to the address as id", () => {
    expect(
      toNetworkValidator({
        ...validator,
        id: "",
        commissionRate: "500",
        apy: -1,
        balance: -1n,
        logo: "logo.png",
        url: "javascript:alert(1)",
      }),
    ).toEqual({ id: "cosmosvaloper1abc", address: "cosmosvaloper1abc", name: "Ledger" });
  });
});

describe("createCoinModuleValidatorsSource", () => {
  it("serves the networks whose currency has a coin module", () => {
    expect(sourceWith(undefined).supports(cosmos)).toBe(true);
    expect(sourceWith(undefined, false).supports(cosmos)).toBe(false);
    expect(sourceWith(undefined).supports(NetworkIdSchema.parse("not_a_network"))).toBe(false);
  });

  it("reads every page", async () => {
    const getValidators = jest.fn(async (cursor?: string) =>
      cursor === undefined
        ? { items: [validator], next: "2" }
        : { items: [{ ...validator, id: "v2", address: "v2" }] },
    );
    const validators = await sourceWith({ getValidators }).read(cosmos, { signal });
    expect(validators.map(({ id }) => id)).toEqual(["cosmosvaloper1abc", "v2"]);
    expect(getValidators).toHaveBeenLastCalledWith("2");
  });

  it("stops on a cursor that does not advance", async () => {
    const stuck = jest.fn(async () => ({ items: [validator], next: "same" }));
    await sourceWith({ getValidators: stuck }).read(cosmos, { signal });
    expect(stuck).toHaveBeenCalledTimes(2);
  });

  it("falls through rather than answer a list cut at MAX_VALIDATOR_PAGES", async () => {
    let page = 0;
    const endless = jest.fn(async () => ({ items: [validator], next: String(++page) }));
    await expect(sourceWith({ getValidators: endless }).read(cosmos, { signal })).rejects.toThrow(
      CoinModuleValidatorsNotServedError,
    );
    expect(endless).toHaveBeenCalledTimes(MAX_VALIDATOR_PAGES);
  });

  it("falls through when the coin module lists no validator", async () => {
    await expect(sourceWith(undefined).read(cosmos, { signal })).rejects.toThrow(
      CoinModuleValidatorsNotServedError,
    );
    const empty = { getValidators: async () => ({ items: [] }) };
    await expect(sourceWith(empty).read(cosmos, { signal })).rejects.toThrow(
      CoinModuleValidatorsNotServedError,
    );
  });

  it("stops once aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const getValidators = jest.fn(async () => ({ items: [validator] }));
    await expect(
      sourceWith({ getValidators }).read(cosmos, { signal: controller.signal }),
    ).rejects.toBeDefined();
    expect(getValidators).not.toHaveBeenCalled();
  });
});
