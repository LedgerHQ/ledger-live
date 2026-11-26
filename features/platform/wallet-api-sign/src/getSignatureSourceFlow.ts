import type { WalletApiSignatureSourceFlow } from "./types";

export function getSignatureSourceFlow(
  manifestId: string,
  walletConnectManifestId: string,
): WalletApiSignatureSourceFlow {
  return manifestId === walletConnectManifestId ? "wallet_connect" : "wallet_api";
}
