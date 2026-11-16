import type { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { getCurrencyConfiguration } from "../../config";
import { isLedgerValidator } from "./isLedgerValidator";

jest.mock("../../config", () => ({ getCurrencyConfiguration: jest.fn() }));

const COSMOS_LEDGER = "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm";

const configOf = (ledgerValidator?: string): CurrencyConfig & Record<string, unknown> => ({
  status: { type: "active" },
  name: "Cosmos",
  unit: { name: "Atom", code: "ATOM", magnitude: 6 },
  ...(ledgerValidator ? { ledgerValidator } : {}),
});

beforeEach(() => {
  jest.mocked(getCurrencyConfiguration).mockImplementation(currencyId => {
    if (currencyId === "cosmos") return configOf(COSMOS_LEDGER);
    if (currencyId === "osmo") return configOf();
    throw new Error(`No currency configuration available for ${currencyId}`);
  });
});

describe("isLedgerValidator", () => {
  it("matches the Ledger validator of the cosmos currency config", () => {
    expect(isLedgerValidator("cosmos", COSMOS_LEDGER)).toBe(true);
    expect(isLedgerValidator("cosmos", "cosmosvaloper1other")).toBe(false);
    expect(getCurrencyConfiguration).toHaveBeenCalledWith("cosmos");
  });

  it("reads the config under the chain id of an aliased currency", () => {
    expect(isLedgerValidator("osmosis", COSMOS_LEDGER)).toBe(false);
    expect(getCurrencyConfiguration).toHaveBeenCalledWith("osmo");
  });

  it("finds none when the config has none or cannot be read", () => {
    expect(isLedgerValidator("axelar", "axelarvaloper1any")).toBe(false);
  });

  it("matches the EVM Ledger validator whatever the address case", () => {
    expect(isLedgerValidator("monad", "0xF249265D16A9D70F684B0E43863242298C25D81C")).toBe(true);
    expect(isLedgerValidator("ethereum", "0xf249265d16a9d70f684b0e43863242298c25d81c")).toBe(false);
  });

  it("finds none for an empty address, another family or an unknown currency", () => {
    expect(isLedgerValidator("cosmos", "")).toBe(false);
    expect(isLedgerValidator("polkadot", "1abc")).toBe(false);
    expect(isLedgerValidator("not_a_currency", COSMOS_LEDGER)).toBe(false);
  });
});
