import type { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { createApi } from "../api";
import coinConfig from "../config";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

type broadcastFunc = {
  signedOperation: SignedOperation;
  account: Account;
};

const broadcast = async ({ signedOperation, account }: broadcastFunc): Promise<Operation> => {
  const config = coinConfig.getCoinConfig(getCryptoCurrencyById(account.currency.id));
  const client = createApi(config);
  const { signature, operation } = signedOperation;
  const hash = await client.broadcast(signature);
  return patchOperationWithHash(operation, hash);
};

export default broadcast;
