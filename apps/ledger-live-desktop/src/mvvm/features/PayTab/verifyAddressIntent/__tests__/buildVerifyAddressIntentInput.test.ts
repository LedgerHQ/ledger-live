import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { buildVerifyAddressIntentInput } from "../buildVerifyAddressIntentInput";

describe("buildVerifyAddressIntentInput", () => {
  it("should use the canton party id when freshAddress is empty", () => {
    const canton = getCryptoCurrencyById("canton_network");
    const account = {
      ...genAccount("verify-canton", { currency: canton }),
      derivationMode: "canton" as const,
      freshAddress: "",
      xpub: "canton-party-id",
    };

    expect(buildVerifyAddressIntentInput(account).expectedAddress).toBe("canton-party-id");
  });
});
