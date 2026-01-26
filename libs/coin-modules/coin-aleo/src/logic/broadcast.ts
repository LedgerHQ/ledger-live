import invariant from "invariant";
import { apiClient } from "../network/api";
import { AleoAccount } from "../types";
import { deserializeTransaction } from "./utils";

export async function broadcast({
  account,
  signedTx,
}: {
  account: AleoAccount;
  signedTx: string;
}): Promise<string> {
  const { provableApi } = account.aleoResources;
  invariant(provableApi, `aleo: api access is not configured for ${account.freshAddress}`);
  invariant(provableApi.jwt, `aleo: api jwt token is missing for ${account.freshAddress}`);

  // get authorization and feeAuthorization from signature
  const { authorization, feeAuthorization } = deserializeTransaction(signedTx);

  const res = await apiClient.submitDelegatedProvingRequest({
    currency: account.currency,
    // @ts-expect-error - temporary FIXME:
    authorization,
    // @ts-expect-error - temporary FIXME:
    feeAuthorization,
    jwt: provableApi.jwt.token,
    broadcast: true,
  });

  return res.transaction.id;
}
