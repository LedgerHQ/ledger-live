import { setConfidentialSendRuntime } from "@ledgerhq/live-common/families/evm/confidential/runtime";
import { confidentialApi } from "./confidentialApi";
import { createConfidentialContext, type CreateConfidentialClient } from "./confidentialRuntime";
import { getSessionBalance } from "./sessionBalances";
import { setSessionUnshield } from "./sessionUnshields";

/**
 * Lets the shared send flow offer a confidential source: the EVM descriptor reads the balances
 * revealed in this session, and the EVM bridge prepares the transfer, the shield or the unshield with the app's
 * Zama client. A signed unshield lands here so the account footer can finalize it.
 */
export function registerConfidentialSendRuntime(createClient: CreateConfidentialClient): void {
  setConfidentialSendRuntime({
    getBalance: tokenAccountId => getSessionBalance(tokenAccountId)?.balance,
    getOwner: tokenAccountId => getSessionBalance(tokenAccountId)?.owner,
    prepareSend: (currencyId, params) =>
      confidentialApi.prepareConfidentialSend(
        createConfidentialContext(currencyId, createClient),
        currencyId,
        params,
      ),
    prepareShield: (currencyId, params) =>
      confidentialApi.prepareShield(
        createConfidentialContext(currencyId, createClient),
        currencyId,
        params,
      ),
    prepareUnshield: (currencyId, params) =>
      confidentialApi.prepareUnshield(
        createConfidentialContext(currencyId, createClient),
        currencyId,
        params,
      ),
    onUnshieldRequested: (tokenAccountId, request) => setSessionUnshield(tokenAccountId, request),
  });
}
