// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import invariant from "invariant";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { DmkSignerZcash } from "@ledgerhq/live-signer-zcash";
import { createBridges } from "@ledgerhq/coin-zcash/bridge";
import zcashAddressResolver from "@ledgerhq/coin-zcash/signer/getAddress";
import type { BitcoinSigner as ZcashSigner } from "@ledgerhq/coin-zcash/types/signer";
import type {
  Transaction as ZcashTransaction,
  TransactionStatus as ZcashTransactionStatus,
  ZcashAccount,
} from "@ledgerhq/coin-zcash/types/bridge";
import type { ZcashConfigInfo } from "@ledgerhq/coin-zcash/config";
import type Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { createResolver, executeWithSigner, type CreateSigner } from "../../bridge/setup";
import { getCurrencyConfiguration } from "../../config";

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

const getCurrencyConfig = (currencyId?: string) => {
  invariant(currencyId, "zcash: currencyId is required in getCurrencyConfig");
  return { info: getCurrencyConfiguration<ZcashConfigInfo>(currencyId) };
};

const bridge: Bridge<ZcashTransaction, ZcashAccount, ZcashTransactionStatus> = createBridges(
  signerContext,
  getCurrencyConfig,
);

const resolver = createResolver(createSigner, zcashAddressResolver);

// No `messageSigner`: the Zcash DMK signer kit does not expose message
// signing (see @ledgerhq/coin-zcash/types/signer BitcoinSigner surface).
export { bridge, resolver, signerContext };

// Re-exported so the host apps can mirror the `zcashShielded` feature flag (via
// `useFeature` → `setZcashShieldedEnabled`) from the same setup module they
// already import. The bridge router reads that mirror to decide which module
// serves a Zcash account -- see `bridge/zcashRouting.ts`.
export { setZcashShieldedEnabled } from "../../bridge/zcashRouting";
