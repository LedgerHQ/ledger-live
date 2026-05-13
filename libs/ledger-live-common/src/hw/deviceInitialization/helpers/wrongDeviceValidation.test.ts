import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { createFixtureAccount } from "../../../mock/fixtures/cryptoCurrencies";
import { buildExpectedAccountIdentity, validateDerivedAddress } from "./wrongDeviceValidation";

const ethereumCurrency = getCryptoCurrencyById("ethereum");

describe("deviceInitialization wrongDeviceValidation", () => {
  it("builds the expected account identity with fresh and seed addresses", () => {
    const account = createFixtureAccount("01", ethereumCurrency);
    account.freshAddress = "0xfresh";
    account.seedIdentifier = "0xseed";

    expect(buildExpectedAccountIdentity(account)).toEqual({
      accountName: getDefaultAccountName(account),
      acceptableDerivedAddresses: ["0xfresh", "0xseed"],
    });
  });

  it("omits the seed identifier when it is missing", () => {
    const account = createFixtureAccount("02", ethereumCurrency);
    account.freshAddress = "0xfresh";
    Object.defineProperty(account, "seedIdentifier", { value: undefined, configurable: true });

    expect(buildExpectedAccountIdentity(account)).toEqual({
      accountName: getDefaultAccountName(account),
      acceptableDerivedAddresses: ["0xfresh"],
    });
  });

  it("returns a match when the derived address is acceptable", () => {
    expect(
      validateDerivedAddress(
        {
          accountName: "Ethereum 1",
          acceptableDerivedAddresses: ["0xfresh", "0xseed"],
        },
        "0xseed",
      ),
    ).toEqual({ status: "match" });
  });

  it("returns a mismatch when the derived address does not match", () => {
    expect(
      validateDerivedAddress(
        {
          accountName: "Ethereum 1",
          acceptableDerivedAddresses: ["0xfresh", "0xseed"],
        },
        "0xother",
      ),
    ).toEqual({ status: "mismatch", accountName: "Ethereum 1" });
  });

  it("returns skipped when validation input is incomplete", () => {
    expect(validateDerivedAddress(undefined, "0xseed")).toEqual({ status: "skipped" });
    expect(
      validateDerivedAddress(
        {
          accountName: "Ethereum 1",
          acceptableDerivedAddresses: ["0xfresh"],
        },
        undefined,
      ),
    ).toEqual({ status: "skipped" });
  });
});
