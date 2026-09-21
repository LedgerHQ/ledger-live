import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/coin-zcash/types/bridge";
import { createTransaction } from "@ledgerhq/coin-zcash/bridge/createTransaction";
import { updateTransaction } from "@ledgerhq/coin-zcash/bridge/updateTransaction";
import { getTransactionStatus } from "@ledgerhq/coin-zcash/bridge/getTransactionStatus";
import { prepareTransaction } from "@ledgerhq/coin-zcash/bridge/prepareTransaction";
import { estimateMaxSpendable } from "@ledgerhq/coin-zcash/bridge/estimateMaxSpendable";
import { getSerializedAddressParameters } from "@ledgerhq/coin-zcash/bridge/exchange";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
} from "@ledgerhq/coin-zcash/bridge/serialization";
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

// Everything above `sync`/`signOperation`/`broadcast`/`scanAccounts` below is
// the real coin-zcash bridge logic (createTransaction, updateTransaction,
// getTransactionStatus, prepareTransaction, estimateMaxSpendable,
// getSerializedAddressParameters, validateAddress, and the bitcoinResources/
// privateInfo raw<->live assign hooks): none of it touches the network or the
// device, so the mock reuses it as-is rather than re-deriving Zcash's balance-
// type/recipient-classification rules a second time. Only the truly
// network/device-bound surface (sync, signOperation, signRawOperation,
// broadcast, scanAccounts) is swapped for the generic mock implementation,
// mirroring families/bitcoin/bridge/mock.ts.

const receive = makeAccountBridgeReceive();

// The second generic is widened to `any` (mirroring families/algorand/bridge/mock.ts):
// `sync`/`receive` below come from the generic mockHelpers, typed over the base
// `Account`, not `ZcashAccount` -- pinning A here would reject them.
const accountBridge: AccountBridge<Transaction, any, TransactionStatus> = {
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
  assignFromAccountRaw,
  assignToAccountRaw,
  getSerializedAddressParameters,
  validateAddress: (address: string) =>
    validateZcashAddress(address, { currencyId: "zcash", networkId: 0 }),
  getEstimationRecipient: () => ZCASH_ESTIMATION_RECIPIENT,
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
