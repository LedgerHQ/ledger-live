import { ContactCurrencyIdSchema } from "@domain/entity-contact";
import {
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

  it("GIVEN Tron WHEN resolving its context THEN it rejects the unsupported app", () => {
    // GIVEN
    const currencyId = ContactCurrencyIdSchema.parse("tron");

    // WHEN
    const resolve = () => resolveContactDeviceContext(currencyId);

    // THEN
    expect(resolve).toThrow(UnsupportedContactDeviceCurrencyError);
  });
});
