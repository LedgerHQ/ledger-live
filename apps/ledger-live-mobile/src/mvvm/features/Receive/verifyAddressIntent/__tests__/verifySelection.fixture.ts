import { genAccount } from "@ledgerhq/live-common/mock/account";
import { AddressSchema, DerivationPathSchema } from "@domain/entity-account-descriptor";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { VerifyAddressSelection } from "../useVerifyAddressFlow";

export const VERIFY_ADDRESS = AddressSchema.parse("0x71C7656EC7ab88b098defB751B7401B5f6d8976F");

/** An Ethereum account whose device shows its receive address. */
export const VERIFY_SELECTION: VerifyAddressSelection = {
  account: genAccount("verify-address", { currency: getCryptoCurrencyById("ethereum") }),
  verification: {
    type: "address",
    path: DerivationPathSchema.parse("m/44h/60h/0h/0/0"),
    address: VERIFY_ADDRESS,
  },
  network: getCryptoCurrencyById("ethereum"),
};
