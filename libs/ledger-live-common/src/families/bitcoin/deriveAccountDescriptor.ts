import { from, map, switchMap } from "rxjs";
import type Transport from "@ledgerhq/hw-transport";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { AccountDescriptorSchema } from "@domain/entity-account-descriptor";
import { asDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import { getNetworkParameters } from "@ledgerhq/coin-bitcoin/networks";
import type { Resolver } from "../../hw/getAddress/types";
import type { DeriveAccountDescriptor } from "../../coin-modules/types";
import { toLegacyPath } from "../../account/accountDescriptor";

type BtcSigner = {
  getWalletXpub(options: { path: string; xpubVersion: number }): Promise<string>;
};

/** A UTXO account is known by its xpub at the account-level path, as the bitcoin sync derives it. */
export const createDeriveAccountDescriptor =
  (
    resolver: Resolver,
    createSigner: (transport: Transport, currency: CryptoCurrency) => BtcSigner,
  ): DeriveAccountDescriptor =>
  (runOnTransport, currency, candidate) => {
    const xpubVersion = getNetworkParameters(currency.id).xpubVersion.readUInt32BE(0);
    const path = toLegacyPath(candidate.accountPath);
    // Resolver first (rejects a mode the app can't address), then the xpub unless aborted meanwhile.
    const readXpub = (transport: Transport, signal: AbortSignal) =>
      from(
        resolver(transport, {
          currency,
          path: toLegacyPath(candidate.addressPath),
          derivationMode: asDerivationMode(candidate.derivationMode),
        }),
      ).pipe(
        switchMap(() => {
          signal.throwIfAborted();
          return from(createSigner(transport, currency).getWalletXpub({ path, xpubVersion }));
        }),
      );
    return runOnTransport(readXpub).pipe(
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
  };
