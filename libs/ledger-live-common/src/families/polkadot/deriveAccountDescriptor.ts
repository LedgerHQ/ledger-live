import { from, map } from "rxjs";
import {
  AccountDescriptorSchema,
  fromDescriptorPath,
  networkFromCurrencyId,
} from "@domain/entity-account-descriptor";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import type { AccountCandidate } from "@domain/entity-derivation";
import type { PolkadotCoinConfig } from "@ledgerhq/coin-polkadot/config";
import { asDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import { getCurrencyConfiguration } from "../../config";
import type { Resolver } from "../../hw/getAddress/types";
import type { DeriveAccountDescriptor } from "../../coin-modules/types";

const POLKADOT = networkFromCurrencyId(CryptoCurrencyIdSchema.parse("polkadot"));
const ASSET_HUB = "assethub_polkadot";

/** The sync moves a migrated Polkadot account onto Asset Hub: discovery names it there, as the scan does. */
const networkOf = (candidate: AccountCandidate) =>
  candidate.network === POLKADOT &&
  getCurrencyConfiguration<PolkadotCoinConfig>(ASSET_HUB).hasBeenMigrated
    ? networkFromCurrencyId(CryptoCurrencyIdSchema.parse(ASSET_HUB))
    : candidate.network;

export const createDeriveAccountDescriptor =
  (resolver: Resolver): DeriveAccountDescriptor =>
  (runOnTransport, currency, candidate) =>
    runOnTransport(transport =>
      from(
        resolver(transport, {
          currency,
          path: fromDescriptorPath(candidate.addressPath),
          derivationMode: asDerivationMode(candidate.derivationMode),
        }),
      ),
    ).pipe(
      map(({ address }) =>
        AccountDescriptorSchema.parse({
          purpose: "account",
          version: "2",
          type: "address",
          network: networkOf(candidate),
          key: address,
          path: candidate.addressPath,
        }),
      ),
    );
