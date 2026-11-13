// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import kaspaResolver from "@ledgerhq/coin-kaspa/hw-getAddress";
import Kaspa from "@ledgerhq/hw-app-kaspa";
import Transport from "@ledgerhq/hw-transport";
import { from, map } from "rxjs";
import { AccountDescriptorSchema } from "@domain/entity-account-descriptor";
import { asDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import { createResolver, CreateSigner, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";
import { KaspaSigner } from "@ledgerhq/coin-kaspa/types/signer";
import { KaspaAccount, Transaction, TransactionStatus } from "@ledgerhq/coin-kaspa/types/bridge";
import { createBridges } from "@ledgerhq/coin-kaspa/bridge";
import type { Bridge } from "@ledgerhq/types-live";
import type { DeriveAccountDescriptor } from "../../coin-modules/types";
import { toLegacyPath } from "../../account-data/full-sync/placeholderAccount";

const createSigner: CreateSigner<KaspaSigner> = (transport: Transport) => {
  return new Kaspa(transport);
};

// const kaspaCoin = getCryptoCurrencyById("kaspa");
const resolver: Resolver = createResolver(createSigner, kaspaResolver);
// const getCurrencyConfig = (): KaspaCoinConfig => getCurrencyConfiguration(kaspaCoin);

const bridge: Bridge<Transaction, KaspaAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
);

/** The legacy scan reads one key per account, at the account path; its sync takes it as the xpub. */
const deriveAccountDescriptor: DeriveAccountDescriptor = (runOnTransport, currency, candidate) =>
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

export { bridge, resolver, deriveAccountDescriptor };
