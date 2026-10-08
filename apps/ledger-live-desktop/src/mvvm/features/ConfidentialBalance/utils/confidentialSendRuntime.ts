import { setConfidentialSendRuntime } from "@ledgerhq/live-common/families/evm/confidential/runtime";
import { confidentialApi } from "./confidentialApi";
import { createConfidentialContext, type CreateConfidentialClient } from "./confidentialRuntime";
import { getSessionBalance } from "./sessionBalances";

/**
 * Lets the shared send flow offer a confidential source: the EVM descriptor reads the balances
 * revealed in this session, and the EVM bridge prepares the transfer with the app's Zama client.
 */
export function registerConfidentialSendRuntime(createClient: CreateConfidentialClient): void {
  setConfidentialSendRuntime({
    getBalance: tokenAccountId => getSessionBalance(tokenAccountId)?.balance,
    prepareSend: (currencyId, params) =>
      confidentialApi.prepareConfidentialSend(
        createConfidentialContext(currencyId, createClient),
        currencyId,
        params,
      ),
  });
}
