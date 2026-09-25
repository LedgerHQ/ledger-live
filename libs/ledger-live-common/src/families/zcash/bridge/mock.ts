import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/coin-zcash/types/bridge";
import type { ZcashAccountBridge } from "@ledgerhq/coin-zcash/bridge";
import { createTransaction } from "@ledgerhq/coin-zcash/bridge/createTransaction";
import { updateTransaction } from "@ledgerhq/coin-zcash/bridge/updateTransaction";
import { getTransactionStatus } from "@ledgerhq/coin-zcash/bridge/getTransactionStatus";
import { prepareTransaction } from "@ledgerhq/coin-zcash/bridge/prepareTransaction";
import { estimateMaxSpendable } from "@ledgerhq/coin-zcash/bridge/estimateMaxSpendable";
import { getSerializedAddressParameters } from "@ledgerhq/coin-zcash/bridge/exchange";
import {
  assignToAccountRaw,
  makeAssignFromAccountRaw,
} from "@ledgerhq/coin-zcash/bridge/serialization";
import type { ZcashConfigInfo } from "@ledgerhq/coin-zcash/config";
import { validateAddress as validateZcashAddress } from "@ledgerhq/coin-zcash/logic/validateAddress";
import { ZCASH_ESTIMATION_RECIPIENT } from "@ledgerhq/coin-zcash/constants";
import {
  makeAccountBridgeReceive,
  scanAccounts,
  signOperation,
  signRawOperation,
  broadcast,
  sync,
} from "../../../bridge/mockHelpers";
import { delay } from "../../../promise";
import { getCurrencyConfiguration } from "../../../config";

// Everything above `sync`/`signOperation`/`broadcast`/`scanAccounts` below is
// the real coin-zcash bridge logic (createTransaction, updateTransaction,
// getTransactionStatus, prepareTransaction, estimateMaxSpendable,
// getSerializedAddressParameters, validateAddress, and the bitcoinResources/
// privateInfo raw<->live assign hooks): none of it touches the network or the
// device, so the mock reuses it as-is rather than re-deriving Zcash's balance-
// type/recipient-classification rules a second time. Only the truly
// network/device-bound surface (sync, signOperation, signRawOperation,
// broadcast, scanAccounts) is swapped for the generic mock implementation,
// mirroring families/bitcoin/bridge/mock.ts -- plus the Zcash-only methods
// below, which the generic mockHelpers know nothing about.

const receive = makeAccountBridgeReceive();

// Stand-ins for what the device (getFullViewingKey/getShieldedAddress) and the
// Zaino client (deriveShieldedAddress) answer on the real bridge.
//
// The UA is the Orchard-only test vector the device app derives for account 0
// of its own test seed (firmware/app-zcash REF_ORCHARD_ADDRESS_ACC_0, also used
// by coin-zcash/src/logic/address.test.ts): a well-formed ZIP-316 address, so
// the recipient classification the mock bridge runs for real reads it as
// private -- as it would a device-derived one. An obviously-fake string would
// be rejected as an invalid recipient the moment a mock self-transfer targets
// the account's own shielded address.
const MOCK_UFVK = "uview1mock";
const MOCK_SHIELDED_ADDRESS =
  "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9";

// `getFullViewingKey`, `deriveShieldedAddress` and `getShieldedAddress` are not
// part of `AccountBridge`: the UFVK export and shielded-receive flows reach them
// by casting to `ZcashAccountBridge` and calling them unconditionally (LLD's
// ZCashExportKeyFlowModal, ZcashShieldedReceiveBlock). Omitting them here is
// therefore a TypeError under MOCK=true, not a flow that degrades gracefully.
type ZcashMockAccountBridge = AccountBridge<Transaction, any, TransactionStatus> &
  Pick<ZcashAccountBridge, "getFullViewingKey" | "deriveShieldedAddress" | "getShieldedAddress">;

// The second generic is widened to `any` (mirroring families/algorand/bridge/mock.ts):
// `sync`/`receive` below come from the generic mockHelpers, typed over the base
// `Account`, not `ZcashAccount` -- pinning A here would reject them.
const accountBridge: ZcashMockAccountBridge = {
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  prepareTransaction,
  estimateMaxSpendable,
  sync,
  receive,
  signOperation,
  signRawOperation,
  broadcast,
  assignFromAccountRaw: makeAssignFromAccountRaw(currencyId => ({
    info: getCurrencyConfiguration<ZcashConfigInfo>(currencyId),
  })),
  assignToAccountRaw,
  getSerializedAddressParameters,
  validateAddress: (address: string) =>
    validateZcashAddress(address, { currencyId: "zcash", networkId: 0 }),
  getEstimationRecipient: () => ZCASH_ESTIMATION_RECIPIENT,
  // Delayed the way mockHelpers' signOperation is: the step's whole content is
  // the "confirm on your device" screen, which resolving in the same tick as it
  // mounts would skip past.
  //
  // Echoes a UFVK the account already carries so re-running the export on a
  // seeded mock account keeps the key it was seeded with.
  getFullViewingKey: async (account, { path }) => {
    await delay(500);
    return {
      viewKey: account.privateInfo?.ufvk ?? MOCK_UFVK,
      path: path ?? account.freshAddressPath,
    };
  },
  deriveShieldedAddress: async () => MOCK_SHIELDED_ADDRESS,
  // Echoes the account's own shielded address rather than deriving one, so the
  // receive flow's device/host comparison matches whatever the account holds --
  // the seeded fixture value as well as the one the export flow just wrote.
  getShieldedAddress: async account => {
    await delay(500);
    return {
      address: account.privateInfo?.shieldedAddress ?? MOCK_SHIELDED_ADDRESS,
    };
  },
};

const currencyBridge: CurrencyBridge = {
  scanAccounts,
  preload: () => Promise.resolve({}),
  hydrate: () => {},
};

export default {
  currencyBridge,
  accountBridge,
};
