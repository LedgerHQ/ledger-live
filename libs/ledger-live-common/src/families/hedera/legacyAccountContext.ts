import { AccountContextSchema } from "@domain/entity-account-context";
import type { LegacyAccountContext } from "../../coin-modules/types";

/** The legacy account keeps the device public key as its seed identifier, which receive and sign check the device against. */
export const hederaLegacyAccountContext: LegacyAccountContext = {
  toLegacyFields: ({ publicKey }) => ({ seedIdentifier: publicKey }),
  // A seed identifier that is not a key, the account id a discovered account once got, is no context.
  fromLegacyFields: ({ seedIdentifier }) => {
    const { data } = AccountContextSchema.safeParse({ publicKey: seedIdentifier });
    return data?.publicKey ? { publicKey: data.publicKey } : undefined;
  },
};
