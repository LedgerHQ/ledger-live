import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { mockTokenCurrency } from "@domain/entity-currency-token/schema.mock";
import { getCurrencyBridge } from "../impl";
import { descriptor as bitcoinDescriptor } from "../../families/bitcoin/descriptor";
import { descriptor as evmDescriptor } from "../../families/evm/descriptor";
import { getDescriptor } from "./registry";

jest.mock("../impl", () => ({ getCurrencyBridge: jest.fn() }));

const usdtOnEthereum = mockTokenCurrency();

describe("getDescriptor", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the family's registry descriptor synchronously", () => {
    expect(getDescriptor(getCryptoCurrencyById("bitcoin"))).toBe(bitcoinDescriptor);
  });

  it("resolves a token through its parent currency's family", () => {
    expect(getDescriptor(usdtOnEthereum)).toBe(evmDescriptor);
  });

  it("returns null for a family without a registry entry", () => {
    const unknown = { ...getCryptoCurrencyById("bitcoin"), family: "unknown" };

    expect(getDescriptor(unknown)).toBeNull();
  });

  // CurrencyBridge is async-loaded, so a bridge-provided descriptor could not reach these
  // synchronous callers; the registry is the only source.
  it("never consults the currency bridge", () => {
    getDescriptor(getCryptoCurrencyById("bitcoin"));
    getDescriptor(usdtOnEthereum);

    expect(getCurrencyBridge).not.toHaveBeenCalled();
  });
});
