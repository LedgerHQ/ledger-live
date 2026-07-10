import type { Account, AccountLike } from "@ledgerhq/types-live";
import { errors, rejectedError } from "./errors";
import { handleEthChainId } from "./ethChainId";
import { handleEthAccounts } from "./ethAccounts";
import { handleWalletSwitchEthereumChain } from "./walletSwitchEthereumChain";
import { handleEthSendTransaction } from "./ethSendTransaction";
import { handlePersonalSign } from "./personalSign";
import { handleEthSignTypedData } from "./ethSignTypedData";
import { handleRpcPassthrough } from "./rpcPassthrough";
import type { DappMessageContext, DappMessageDeps, JsonRpcRequestMessage } from "./types";

// Type guard function to make typescript happy
function isParentAccountPresent(
  account: AccountLike,
  parentAccount?: Account,
): parentAccount is Account {
  if (account.type === "TokenAccount") {
    return !!parentAccount;
  }

  return true;
}

/**
 * Entry point for every JSON-RPC message a dApp sends. Runs the shared guards
 * (jsonrpc version, network, account, parent account), then narrows the volatile
 * {@link DappMessageDeps} into a {@link DappMessageContext} and dispatches to the
 * per-method handler.
 */
export async function onDappMessage(
  deps: DappMessageDeps,
  data: JsonRpcRequestMessage,
): Promise<void> {
  const { currentNetwork, currentAccount, currentParentAccount, postMessage } = deps;

  if (data.jsonrpc !== "2.0") {
    console.error("Request is not a jsonrpc 2.0: ", data);
    return;
  }

  if (!currentNetwork) {
    console.error("No network selected: ", data);
    postMessage(
      JSON.stringify({
        id: data.id,
        jsonrpc: "2.0",
        error: rejectedError(errors.InternalError, "No network selected"),
      }),
    );
    return;
  }

  if (!currentAccount) {
    console.error("No account selected: ", data);
    postMessage(
      JSON.stringify({
        id: data.id,
        jsonrpc: "2.0",
        error: rejectedError(errors.InternalError, "No account selected"),
      }),
    );
    return;
  }

  if (!isParentAccountPresent(currentAccount, currentParentAccount)) {
    console.error("No parent account found for the currentAccount: ", currentAccount, data);
    postMessage(
      JSON.stringify({
        id: data.id,
        jsonrpc: "2.0",
        error: rejectedError(errors.InternalError, "No parent account found"),
      }),
    );
    return;
  }

  const signerAccount = currentAccount.type === "Account" ? currentAccount : currentParentAccount;

  const context: DappMessageContext = {
    manifest: deps.manifest,
    currentAccount,
    signerAccount,
    currentNetwork,
    postMessage,
    tracking: deps.tracking,
    uiHook: deps.uiHook,
    setCurrentAccount: deps.setCurrentAccount,
    setCurrentAccountHist: deps.setCurrentAccountHist,
    mevProtected: deps.mevProtected,
    referrer: deps.referrer,
    wsRef: deps.wsRef,
  };

  switch (data.method) {
    case "eth_chainId": {
      handleEthChainId(context, data);
      break;
    }
    // https://eips.ethereum.org/EIPS/eip-1102
    // https://docs.metamask.io/guide/rpc-api.html#eth-requestaccounts
    case "eth_requestAccounts":
    // legacy method, cf. https://docs.metamask.io/guide/ethereum-provider.html#legacy-methods
    // eslint-disable-next-line no-fallthrough
    case "enable":
    // https://eips.ethereum.org/EIPS/eip-1474#eth_accounts
    // https://eth.wiki/json-rpc/API#eth_accounts
    // eslint-disable-next-line no-fallthrough
    case "eth_accounts": {
      handleEthAccounts(context, data);
      break;
    }

    case "wallet_switchEthereumChain": {
      await handleWalletSwitchEthereumChain(context, data);
      break;
    }

    case "eth_sendTransaction": {
      await handleEthSendTransaction(context, data);
      break;
    }

    case "personal_sign": {
      await handlePersonalSign(context, data);
      break;
    }

    case data.method.match(/eth_signTypedData(_v.)?$/)?.input: {
      await handleEthSignTypedData(context, data);
      break;
    }

    default: {
      handleRpcPassthrough(context, data);
      break;
    }
  }
}
