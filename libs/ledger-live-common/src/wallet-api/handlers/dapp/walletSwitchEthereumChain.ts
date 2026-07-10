import { dappSwitchEthereumChainLogic } from "../../logic/dapp/switchEthereumChain";
import { errors, rejectedError } from "./errors";
import type { DappMessageContext, JsonRpcRequestMessage } from "./types";

// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-3326.md
export async function handleWalletSwitchEthereumChain(
  { manifest, postMessage, uiHook, setCurrentAccount, setCurrentAccountHist }: DappMessageContext,
  data: JsonRpcRequestMessage,
): Promise<void> {
  const { chainId } = data.params[0];

  // Check chanId is valid hex string
  const decimalChainId = parseInt(chainId, 16);

  if (isNaN(decimalChainId)) {
    postMessage(
      JSON.stringify({
        id: data.id,
        jsonrpc: "2.0",
        error: rejectedError(errors.InvalidParams, "Invalid chainId"),
      }),
    );
    return;
  }

  // Check chain ID is known to the wallet
  const requestedCurrency = manifest.dapp?.networks.find(n => n.chainID === decimalChainId);

  if (!requestedCurrency) {
    postMessage(
      JSON.stringify({
        id: data.id,
        jsonrpc: "2.0",
        error: rejectedError(errors.InvalidParams, `Chain ID ${chainId} is not supported`),
      }),
    );
    return;
  }

  try {
    await dappSwitchEthereumChainLogic(
      { manifest, setCurrentAccount, setCurrentAccountHist },
      requestedCurrency,
      ({ currencyIds, areCurrenciesFiltered, onSuccess, onCancel }) =>
        uiHook["account.request"]({ currencyIds, areCurrenciesFiltered, onSuccess, onCancel }),
    );
    postMessage(
      JSON.stringify({
        id: data.id,
        jsonrpc: "2.0",
        result: null,
      }),
    );
  } catch (error) {
    postMessage(
      JSON.stringify({
        id: data.id,
        jsonrpc: "2.0",
        error: rejectedError(errors.UserRejected, `error switching chain: ${error}`),
      }),
    );
  }
}
