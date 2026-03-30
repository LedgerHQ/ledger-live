import invariant from "invariant";
import { apiClient } from "../network/api";
import type { AleoAccount, AleoCoinConfig } from "../types";
import { sdkClient } from "../network/sdk";
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
  const jwt = account.aleoResources?.provableApi?.jwt?.token;
  invariant(jwt, `aleo: jwt token is missing for ${account.freshAddress}`);

  // get authorization and feeAuthorization from signed transaction
  const { authorization, feeAuthorization } = fromHex<{
    authorization: Record<string, unknown>;
    feeAuthorization?: Record<string, unknown>;
  }>(signedTx);

  if (!config.useEncryptedProve) {
    const res = await apiClient.submitDelegatedProvingRequest({
      currency: account.currency,
      authorization,
      ...(feeAuthorization && { feeAuthorization }),
      jwt,
      broadcast: true,
    });

    return res.transaction.id;
  }

  const publicKeyResponse = await apiClient.getProvePublicKey({
    currency: account.currency,
    jwt,
  });

  const encryptedData = await sdkClient.encryptProvingRequest({
    publicKey: publicKeyResponse.public_key,
    currency: account.currency,
    jwt,
    authorization,
    ...(feeAuthorization && { feeAuthorization }),
    broadcast: true,
  });

  const res = await apiClient.submitEncryptedDelegatedProvingRequest({
    currency: account.currency,
    jwt,
    keyId: publicKeyResponse.key_id,
    encryptedData,
  });

  return res.transaction.id;
}
