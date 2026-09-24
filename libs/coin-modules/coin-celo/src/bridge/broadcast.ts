import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { AccountBridge } from "@ledgerhq/types-live";
import { getCeloClient } from "../network/client";
import { Transaction } from "../types";
import { bridgeCoinConfig } from "./coinConfig";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { operation, signature },
}) => {
  const client = getCeloClient(bridgeCoinConfig());
  const hash = await client.sendRawTransaction({
    serializedTransaction: signature as `0x${string}`,
  });
  return patchOperationWithHash(operation, hash);
};

export default broadcast;
