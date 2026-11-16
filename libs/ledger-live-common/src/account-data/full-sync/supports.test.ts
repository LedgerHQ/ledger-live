import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
import { fromLegacyAccount } from "../../account/accountDescriptor";
import { isFullSyncSupported } from "./supports";
import { NetworkIdSchema } from "@domain/entity-account-descriptor";

const descriptor = fromLegacyAccount(
  genAccount("supports", { currency: getCryptoCurrencyById("ethereum") }),
);

describe("isFullSyncSupported", () => {
  it("supports the account of a known crypto currency", () => {
    expect(isFullSyncSupported(descriptor)).toBe(true);
  });

  it("does not support a network no crypto currency matches", () => {
    expect(isFullSyncSupported({ ...descriptor, network: NetworkIdSchema.parse("nope") })).toBe(
      false,
    );
  });
});
