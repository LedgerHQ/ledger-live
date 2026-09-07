import { ContactCurrencyIdSchema } from "@domain/entity-contact";
import {
  isContactDeviceCurrencySupported,
  resolveContactDeviceContext,
  UnsupportedContactDeviceCurrencyError,
} from "./resolveContactDeviceContext";

describe("resolveContactDeviceContext", () => {
  it("GIVEN Ethereum WHEN resolving its context THEN it returns the Ethereum app and chain ID", () => {
    // GIVEN
    const currencyId = ContactCurrencyIdSchema.parse("ethereum");

    // WHEN
    const context = resolveContactDeviceContext(currencyId);

    // THEN
    expect(context).toEqual({
      blockchainFamily: "evm",
      chainId: 1,
      initializationInput: {
        appName: "Ethereum",
        dependencies: [],
        requireLatestFirmware: false,
      },
    });
  });

  it("GIVEN a token WHEN resolving its context THEN it uses the parent network", () => {
    // GIVEN
    const currencyId = ContactCurrencyIdSchema.parse("base/erc20/usd_coin");

    // WHEN
    const context = resolveContactDeviceContext(currencyId);

    // THEN
    expect(context).toMatchObject({
      blockchainFamily: "evm",
      chainId: 8453,
      initializationInput: { appName: "Ethereum" },
    });
  });

  it("GIVEN Tron WHEN resolving its context THEN it returns the Tron app and coin type", () => {
    // GIVEN
    const currencyId = ContactCurrencyIdSchema.parse("tron");

    // WHEN
    const context = resolveContactDeviceContext(currencyId);

    // THEN
    expect(context).toEqual({
      blockchainFamily: "tron",
      chainId: 195,
      initializationInput: {
        appName: "Tron",
        dependencies: [],
        requireLatestFirmware: false,
      },
    });
  });

  it("GIVEN an unsupported app WHEN resolving its context THEN it rejects the currency", () => {
    // GIVEN
    const currencyId = ContactCurrencyIdSchema.parse("bitcoin");

    // WHEN
    const resolve = () => resolveContactDeviceContext(currencyId);

    // THEN
    expect(resolve).toThrow(UnsupportedContactDeviceCurrencyError);
  });

  it("GIVEN an EVM network running its own app WHEN resolving its context THEN it rejects the currency", () => {
    // GIVEN
    const currencyId = ContactCurrencyIdSchema.parse("ethereum_classic");

    // WHEN
    const resolve = () => resolveContactDeviceContext(currencyId);

    // THEN
    expect(resolve).toThrow(UnsupportedContactDeviceCurrencyError);
  });
});

describe("isContactDeviceCurrencySupported", () => {
  it.each([
    ["ethereum", true],
    ["polygon", true],
    ["base/erc20/usd_coin", true],
    ["tron", true],
    ["ethereum_classic", false],
    ["bitcoin", false],
  ])("GIVEN %s THEN it reports %s", (currencyId, isSupported) => {
    expect(isContactDeviceCurrencySupported(ContactCurrencyIdSchema.parse(currencyId))).toBe(
      isSupported,
    );
  });
});
