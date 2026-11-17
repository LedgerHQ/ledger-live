import { from, map, switchMap } from "rxjs";
import type Transport from "@ledgerhq/hw-transport";
import { AccountDescriptorSchema } from "@domain/entity-account-descriptor";
import { asDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import type { Resolver } from "../../hw/getAddress/types";
import type { DeriveAccountDescriptor } from "../../coin-modules/types";
import { toLegacyPath } from "../../account/accountDescriptor";

type CardanoKeySigner = {
  getPublicKey(path: string): Promise<{ publicKeyHex: string; chainCodeHex: string }>;
};

/** The extended public key the legacy sync reads at the account path, after the address its scan derives first. */
export const createDeriveAccountDescriptor =
  (
    resolver: Resolver,
    createSigner: (transport: Transport) => CardanoKeySigner,
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
          return from(createSigner(transport).getPublicKey(toLegacyPath(candidate.accountPath)));
        }),
      ),
    ).pipe(
      map(({ publicKeyHex, chainCodeHex }) =>
        AccountDescriptorSchema.parse({
          purpose: "account",
          version: "2",
          type: "utxo",
          network: candidate.network,
          key: `${publicKeyHex}${chainCodeHex}`,
          path: candidate.accountPath,
        }),
      ),
    );
