import type { Logger } from "@ledgerhq/coin-module-framework/config";
import type { TronCoinConfig } from "../../config";
import { encode58Check } from "../../network/format";
import { EnergyRentProviderNotConfigured } from "../../types/errors";
import { maxRentBaseUnits, rentPriceMargin, tronifyPaymentAddresses } from "./paymentPolicy";

const logger: jest.MockedFunction<Logger> = jest.fn();

beforeEach(() => {
  logger.mockClear();
});

// Payees of real Tronify orders; any valid TRON addresses would do here.
const TRONIFY_PAYEES = [
  "TDii6vao7xyWg2rKPbCPWVRpSmne8xcqYx",
  "TPyiQrP19oaLu5bQcn1UJDuRqvZAJvYqjQ",
  "TWXcJPJhtdVWNiLRU5b4iVL2wJXdiJ3Bmj",
];
// The same payees as 41-prefixed hex, decoded outside the code under test.
const TRONIFY_PAYEES_HEX = [
  "4129228e5d382b7a2c2a0dbc05e6d6507f4dbb3bbe",
  "4199aa4fb789b27f45c9c5293260f922dda046014b",
  "41e18346770a4409732b63e57abe70d347114e49bc",
];

// The USDT contract: a well-known base58 / hex pair, to pin the lower-case 41-prefixed form.
const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const USDT_CONTRACT_HEX = "41a614f803b6fd780986a42c78ec9c7f77e6ded13c";

const BITCOIN_ADDRESS = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";

const configWith = (energyRent: unknown): TronCoinConfig =>
  ({
    status: { type: "active" },
    name: "Tron",
    unit: { name: "TRX", code: "TRX", magnitude: 6 },
    explorer: { url: "https://tron.coin.ledger.com" },
    energyRent,
  }) as unknown as TronCoinConfig;

const tronifyConfig = (tronify: Record<string, unknown>): TronCoinConfig =>
  configWith({ provider: "tronify", tronify: { url: "https://open.tronify.io", ...tronify } });

describe("tronifyPaymentAddresses", () => {
  it("returns the listed addresses as lower-case 41-prefixed hex", () => {
    const addresses = tronifyPaymentAddresses(
      tronifyConfig({ paymentAddresses: [USDT_CONTRACT, ...TRONIFY_PAYEES] }),
    );

    expect(addresses).toEqual(new Set([USDT_CONTRACT_HEX, ...TRONIFY_PAYEES_HEX]));
  });

  it.each([
    ["no energyRent section", configWith(undefined)],
    ["no tronify section", configWith({ provider: "tronify" })],
    ["no paymentAddresses", tronifyConfig({})],
    ["an empty list", tronifyConfig({ paymentAddresses: [] })],
    ["a string instead of a list", tronifyConfig({ paymentAddresses: TRONIFY_PAYEES[0] })],
    ["an object instead of a list", tronifyConfig({ paymentAddresses: { 0: TRONIFY_PAYEES[0] } })],
    ["a null list", tronifyConfig({ paymentAddresses: null })],
  ])("throws when coin-config has %s", (_label, config) => {
    expect(() => tronifyPaymentAddresses(config)).toThrow(EnergyRentProviderNotConfigured);
  });

  it.each([
    ["not base58", "not-an-address"],
    ["a base58 string with a bad checksum", `${TRONIFY_PAYEES[0].slice(0, -1)}y`],
    ["not a string", 41],
    ["null", null],
    ["a valid base58check address of another chain", BITCOIN_ADDRESS],
    ["a 41-prefixed payload of the wrong length", encode58Check(`41${"ab".repeat(19)}`)],
    ["a 41-prefixed payload that is too long", encode58Check(`41${"ab".repeat(21)}`)],
  ])("throws when the only entry is %s", (_label, entry) => {
    expect(() => tronifyPaymentAddresses(tronifyConfig({ paymentAddresses: [entry] }))).toThrow(
      EnergyRentProviderNotConfigured,
    );
  });

  it("throws on one bad entry among valid ones, rather than dropping it", () => {
    expect(() =>
      tronifyPaymentAddresses(
        tronifyConfig({ paymentAddresses: [...TRONIFY_PAYEES, "not-an-address"] }),
      ),
    ).toThrow(EnergyRentProviderNotConfigured);
  });
});

describe("maxRentBaseUnits", () => {
  it("defaults to 10 USDT in base units", () => {
    expect(maxRentBaseUnits(logger, tronifyConfig({})).toFixed()).toBe("10000000");
    expect(logger).not.toHaveBeenCalled();
  });

  it.each([
    ["no energyRent section", configWith(undefined)],
    ["no tronify section", configWith({ provider: "tronify" })],
  ])("defaults silently with %s", (_label, config) => {
    expect(maxRentBaseUnits(logger, config).toFixed()).toBe("10000000");
    expect(logger).not.toHaveBeenCalled();
  });

  it("honours an override, in USDT, as base units", () => {
    expect(maxRentBaseUnits(logger, tronifyConfig({ maxRentAmount: 3 })).toFixed()).toBe("3000000");
    expect(logger).not.toHaveBeenCalled();
  });

  it.each([
    [1.2345678, "1234567"],
    [0.0000019, "1"],
  ])("should floor %s USDT to %s base units when it has more decimals than USDT", (usdt, units) => {
    expect(maxRentBaseUnits(logger, tronifyConfig({ maxRentAmount: usdt })).toFixed()).toBe(units);
  });

  it.each([
    ["zero", 0],
    ["negative", -1],
    ["NaN", NaN],
    ["Infinity", Infinity],
    ["-Infinity", -Infinity],
    ["a string", "5"],
    ["null", null],
  ])("logs and falls back to the default for %s", (_label, value) => {
    expect(maxRentBaseUnits(logger, tronifyConfig({ maxRentAmount: value })).toFixed()).toBe(
      "10000000",
    );
    expect(logger).toHaveBeenCalledTimes(1);
    expect(logger).toHaveBeenCalledWith(
      "tron/energyRent",
      "ignoring invalid coin-config maxRentAmount, using default",
      { value },
    );
  });
});

describe("rentPriceMargin", () => {
  it("defaults to 5%", () => {
    expect(rentPriceMargin(logger, tronifyConfig({}))).toBe(0.05);
    expect(logger).not.toHaveBeenCalled();
  });

  it.each([
    ["no energyRent section", configWith(undefined)],
    ["no tronify section", configWith({ provider: "tronify" })],
  ])("defaults silently with %s", (_label, config) => {
    expect(rentPriceMargin(logger, config)).toBe(0.05);
    expect(logger).not.toHaveBeenCalled();
  });

  it.each([
    ["an override", 0.1],
    ["zero, which turns the margin off", 0],
    ["the largest margin short of 1", 0.999],
  ])("honours %s", (_label, margin) => {
    expect(rentPriceMargin(logger, tronifyConfig({ rentPriceMargin: margin }))).toBe(margin);
    expect(logger).not.toHaveBeenCalled();
  });

  it.each([
    ["one", 1],
    ["above one", 1.5],
    ["negative", -0.1],
    ["NaN", NaN],
    ["Infinity", Infinity],
    ["a string", "0.1"],
    ["null", null],
  ])("logs and falls back to the default for %s", (_label, value) => {
    expect(rentPriceMargin(logger, tronifyConfig({ rentPriceMargin: value }))).toBe(0.05);
    expect(logger).toHaveBeenCalledTimes(1);
    expect(logger).toHaveBeenCalledWith(
      "tron/energyRent",
      "ignoring invalid coin-config rentPriceMargin, using default",
      { value },
    );
  });
});
