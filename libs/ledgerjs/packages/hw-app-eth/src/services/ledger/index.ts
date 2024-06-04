// This implements the resolution of a Transaction using Ledger's own API
import {
  signDomainResolution,
  signAddressResolution,
} from "@ledgerhq/domain-service/signers/index";
import { LedgerEthTransactionService } from "../types";

/**
 * @ignore for external documentation
 * @deprecated
 *
 * In charge of collecting the different APDUs necessary for clear signing
 * a transaction based on a specified configuration.
 */
const resolveTransaction: LedgerEthTransactionService["resolveTransaction"] = async (
  _rawTxHex,
  _loadConfig,
  _resolutionConfig,
) => {
  return;
};

export default {
  resolveTransaction,
  signDomainResolution,
  signAddressResolution,
} as LedgerEthTransactionService;
