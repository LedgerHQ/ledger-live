import { AccountContextSchema } from "@domain/entity-account-context";
import type { LegacyAccountContext } from "../../coin-modules/types";

/** Receive and sign check the device against the seed identifier, which legacy scans set to the public key. */
export const hederaLegacyAccountContext: LegacyAccountContext = {
  toLegacyFields: ({ publicKey }) => ({ seedIdentifier: publicKey }),
  fromLegacyFields: ({ seedIdentifier }) => {
    const { data } = AccountContextSchema.safeParse({ publicKey: seedIdentifier });
    return data?.publicKey ? { publicKey: data.publicKey } : undefined;
  },
};
