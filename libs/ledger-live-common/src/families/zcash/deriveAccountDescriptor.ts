import { from, map, switchMap } from "rxjs";
import type Transport from "@ledgerhq/hw-transport";
import { AccountDescriptorSchema } from "@domain/entity-account-descriptor";
import { asDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import { deriveAccountXpub } from "@ledgerhq/coin-zcash/signer";
import type { BitcoinSigner as ZcashSigner } from "@ledgerhq/coin-zcash/types/signer";
import type { Resolver } from "../../hw/getAddress/types";
import type { DeriveAccountDescriptor } from "../../coin-modules/types";
import { toLegacyPath } from "../../account/accountDescriptor";

/** The xpub the legacy sync composes at the account path, after the address its scan derives first. */
export const createDeriveAccountDescriptor =
  (
    resolver: Resolver,
    createSigner: (transport: Transport) => ZcashSigner,
  ): DeriveAccountDescriptor =>
  (runOnTransport, currency, candidate) =>
    runOnTransport((transport, signal) =>
      from(
        resolver(transport, {
          currency,
          path: toLegacyPath(candidate.addressPath),
          derivationMode: asDerivationMode(candidate.derivationMode),
        }),
      ).pipe(
        switchMap(() => {
          signal.throwIfAborted();
          return from(
            deriveAccountXpub(createSigner(transport), toLegacyPath(candidate.accountPath), signal),
          );
        }),
      ),
    ).pipe(
      map(xpub =>
        AccountDescriptorSchema.parse({
          purpose: "account",
          version: "2",
          type: "utxo",
          network: candidate.network,
          key: xpub,
          path: candidate.accountPath,
        }),
      ),
    );

// No `messageSigner`: the Zcash DMK signer kit does not expose message
// signing (see @ledgerhq/coin-zcash/types/signer BitcoinSigner surface).
