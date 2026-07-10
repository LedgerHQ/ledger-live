import type { DappMessageContext, JsonRpcRequestMessage } from "./types";

// Handles the account-listing methods:
// - https://eips.ethereum.org/EIPS/eip-1102 (eth_requestAccounts)
// - the legacy `enable` method
//   cf. https://docs.metamask.io/guide/ethereum-provider.html#legacy-methods
// - https://eth.wiki/json-rpc/API#eth_accounts (eth_accounts)
export function handleEthAccounts(
  { signerAccount, postMessage }: DappMessageContext,
  data: JsonRpcRequestMessage,
): void {
  postMessage(
    JSON.stringify({
      id: data.id,
      jsonrpc: "2.0",
      result: [signerAccount.freshAddress],
    }),
  );
}
