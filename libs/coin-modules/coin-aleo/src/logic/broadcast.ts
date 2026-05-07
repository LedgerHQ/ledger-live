import { apiClient } from "../network/api";
import { sdkClient } from "../network/sdk";
import type { AleoAccount, AleoCoinConfig } from "../types";
import { fromHex, resolveConfig } from "./utils";

export async function broadcast({
  configOrCurrencyId,
  account,
  signedTx,
}: {
  configOrCurrencyId: AleoCoinConfig | string;
  account: AleoAccount;
  signedTx: string;
}): Promise<string> {
  const config = resolveConfig(configOrCurrencyId);

  // get authorization and feeAuthorization from signed transaction
  const { authorization, feeAuthorization } = fromHex<{
    authorization: Record<string, unknown>;
    feeAuthorization?: Record<string, unknown>;
  }>(signedTx);

  // TODO: not used anymore, remove with https://ledgerhq.atlassian.net/browse/LIVE-29982
  if (!config.useEncryptedProve) {
    const res = await apiClient.submitDelegatedProvingRequest({
      currency: account.currency,
      authorization,
      ...(feeAuthorization && { feeAuthorization }),
      broadcast: true,
    });

    return res.transaction.id;
  }

  const publicKeyResponse = await apiClient.getProvePublicKey({
    currency: account.currency,
  });

  const encryptedData = await sdkClient.encryptProvingRequest({
    publicKey: publicKeyResponse.data.public_key,
    currency: account.currency,
    authorization,
    ...(feeAuthorization && { feeAuthorization }),
    broadcast: true,
  });

  const res = await apiClient.submitEncryptedDelegatedProvingRequest({
    currency: account.currency,
    keyId: publicKeyResponse.data.key_id,
    encryptedData,
    stickySessionCookie: publicKeyResponse.stickySessionCookie,
  });

  if (res.broadcast_result && res.broadcast_result.status !== "Accepted") {
    const status = res.broadcast_result.status;
    const error = "message" in res.broadcast_result ? res.broadcast_result.message : null;

    throw new Error(`aleo: broadcast failed with status: ${status} (${error ?? "Unknown error"})`);
  }

  return res.transaction.id;
}
