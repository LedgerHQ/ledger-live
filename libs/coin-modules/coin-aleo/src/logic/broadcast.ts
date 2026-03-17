import invariant from "invariant";
import { apiClient } from "../network/api";
import type { AleoAccount } from "../types";
import { deserializeTransaction } from "./utils";

export async function broadcast({
  account,
  signedTx,
}: {
  account: AleoAccount;
  signedTx: string;
}): Promise<string> {
  const jwt = account.aleoResources?.provableApi?.jwt?.token;
  invariant(jwt, `aleo: jwt token is missing for ${account.freshAddress}`);

  // get authorization and feeAuthorization from signed transaction
  const { authorization, feeAuthorization } = deserializeTransaction<{
    authorization: Record<string, unknown>;
    feeAuthorization?: Record<string, unknown>;
  }>(signedTx);

  const res = await apiClient.submitDelegatedProvingRequest({
    currency: account.currency,
    authorization,
    ...(feeAuthorization && { feeAuthorization }),
    jwt,
    broadcast: true,
  });

  return res.transaction.id;
}
