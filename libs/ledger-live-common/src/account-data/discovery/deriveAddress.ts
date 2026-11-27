import { from, map, type Observable } from "rxjs";
import { AccountDescriptorSchema, type AccountDescriptor } from "@domain/entity-account-descriptor";
import type { AccountCandidate } from "@domain/entity-derivation";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { asDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import { currencyIdFromNetwork } from "@domain/entity-network";
import { fromDescriptorPath } from "@domain/entity-derivation";
import getAddress from "../../hw/getAddress";
import { keyOfDerivedAccount } from "../../account/accountDescriptor";
import type { RunOnTransport } from "../../coin-modules/types";

export type DerivedAddressDescriptor = {
  readonly descriptor: AccountDescriptor;
  readonly address: string;
  readonly publicKey: string;
};

/** Derives an address family's descriptor and its device public key, as `scanAccounts` does. */
export function deriveAddressWithPublicKey(
  runOnTransport: RunOnTransport,
  candidate: AccountCandidate,
): Observable<DerivedAddressDescriptor> {
  const currency = getCryptoCurrencyById(currencyIdFromNetwork(candidate.network));
  return runOnTransport(transport =>
    from(
      getAddress(transport, {
        currency,
        path: fromDescriptorPath(candidate.addressPath),
        derivationMode: asDerivationMode(candidate.derivationMode),
      }),
    ),
  ).pipe(
    map(derived => ({
      descriptor: AccountDescriptorSchema.parse({
        purpose: "account",
        version: "2",
        type: "address",
        network: candidate.network,
        key: keyOfDerivedAccount(currency.id, derived),
        path: candidate.addressPath,
      }),
      address: derived.address,
      publicKey: derived.publicKey,
    })),
  );
}

/** Derives an address family's descriptor with its resolver, as `scanAccounts` does. */
export function deriveAddress(
  runOnTransport: RunOnTransport,
  candidate: AccountCandidate,
): Observable<AccountDescriptor> {
  return deriveAddressWithPublicKey(runOnTransport, candidate).pipe(
    map(({ descriptor }) => descriptor),
  );
}
