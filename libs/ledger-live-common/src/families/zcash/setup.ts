// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import invariant from "invariant";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { DmkSignerZcash } from "@ledgerhq/live-signer-zcash";
import { createBridges } from "@ledgerhq/coin-zcash/bridge";
import zcashAddressResolver from "@ledgerhq/coin-zcash/signer/getAddress";
import { deriveAccountXpub } from "@ledgerhq/coin-zcash/signer";
import type { BitcoinSigner as ZcashSigner } from "@ledgerhq/coin-zcash/types/signer";
import type {
  Transaction as ZcashTransaction,
  TransactionStatus as ZcashTransactionStatus,
  ZcashAccount,
} from "@ledgerhq/coin-zcash/types/bridge";
import type { ZcashCoinConfig } from "@ledgerhq/coin-zcash/config";
import type Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { from, map, switchMap } from "rxjs";
import { AccountDescriptorSchema } from "@domain/entity-account-descriptor";
import { asDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import type { DeriveAccountDescriptor } from "../../coin-modules/types";
import { toLegacyPath } from "../../account-data/full-sync/placeholderAccount";
import { createResolver, executeWithSigner, type CreateSigner } from "../../bridge/setup";
import { buildContext } from "../../bridge/generic-coin-framework/api/context";
import { isZcashShieldedEnabled } from "../../bridge/zcashRouting";

type TransportWithDmk = Transport &
  Partial<{
    dmk: DeviceManagementKit;
    sessionId: string;
  }>;

const createSigner: CreateSigner<ZcashSigner> = (transport: TransportWithDmk) => {
  invariant(transport.dmk, "zcash: transport.dmk is missing");
  invariant(transport.sessionId, "zcash: transport.sessionId is missing");
  return new DmkSignerZcash(transport.dmk, transport.sessionId);
};

const signerContext = executeWithSigner(createSigner);

const bridge: Bridge<ZcashTransaction, ZcashAccount, ZcashTransactionStatus> = createBridges(
  signerContext,
  buildContext<ZcashCoinConfig>("zcash"),
  { isShieldedEnabled: isZcashShieldedEnabled },
);

const resolver = createResolver(createSigner, zcashAddressResolver);

/** The xpub the legacy sync composes at the account path, after the address its scan derives first. */
const deriveAccountDescriptor: DeriveAccountDescriptor = (runOnTransport, currency, candidate) =>
  runOnTransport(transport =>
    from(
      resolver(transport, {
        currency,
        path: toLegacyPath(candidate.addressPath),
        derivationMode: asDerivationMode(candidate.derivationMode),
      }),
    ).pipe(
      switchMap(() =>
        from(deriveAccountXpub(createSigner(transport), toLegacyPath(candidate.accountPath))),
      ),
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
export { bridge, resolver, signerContext, deriveAccountDescriptor };

// Re-exported so the host apps can mirror the `zcashShielded` feature flag (via
// `useFeature` → `setZcashShieldedEnabled`) from the same setup module they
// already import. The bridge reads that mirror to decide whether it runs the
// shielded engine or stays transparent-only -- see `bridge/zcashRouting.ts`.
export { setZcashShieldedEnabled } from "../../bridge/zcashRouting";
