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
      broadcast: true,
    });

    return res.transaction.id;
  }

  const publicKeyResponse = await apiClient.getProvePublicKey({
    currency: account.currency,
  });

  console.log("DEBUG3", authorization);
  console.log("DEBUG3", JSON.parse(authorization as unknown as string));

  const encryptedData = await sdkClient.encryptProvingRequest({
    publicKey: publicKeyResponse.public_key,
    currency: account.currency,
    authorization: JSON.parse(authorization as unknown as string),
    ...(feeAuthorization && { feeAuthorization }),
    broadcast: true,
  });

  const res = await apiClient.submitEncryptedDelegatedProvingRequest({
    currency: account.currency,
    keyId: publicKeyResponse.key_id,
    encryptedData,
  });

  return res.transaction.id;
}
