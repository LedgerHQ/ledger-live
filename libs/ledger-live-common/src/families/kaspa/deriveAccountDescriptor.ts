import { from, map } from "rxjs";
import { AccountDescriptorSchema } from "@domain/entity-account-descriptor";
import { asDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import type { Resolver } from "../../hw/getAddress/types";
import type { DeriveAccountDescriptor } from "../../coin-modules/types";
import { toLegacyPath } from "../../account/accountDescriptor";

/** The legacy scan reads one key per account, at the account path; its sync takes it as the xpub. */
export const createDeriveAccountDescriptor =
  (resolver: Resolver): DeriveAccountDescriptor =>
  (runOnTransport, currency, candidate) =>
    runOnTransport(transport =>
      from(
        resolver(transport, {
          currency,
          path: toLegacyPath(candidate.accountPath),
          derivationMode: asDerivationMode(candidate.derivationMode),
        }),
      ),
    ).pipe(
      map(({ publicKey }) =>
        AccountDescriptorSchema.parse({
          purpose: "account",
          version: "2",
          type: "utxo",
          network: candidate.network,
          key: publicKey,
          path: candidate.accountPath,
        }),
      ),
    );
