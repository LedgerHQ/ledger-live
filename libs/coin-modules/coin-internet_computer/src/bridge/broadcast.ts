import { AccountBridge } from "@ledgerhq/types-live";
import { broadcastTxn } from "../api";
import { Transaction } from "../types";
import { log } from "@ledgerhq/logs";
import invariant from "invariant";
import { MAINNET_LEDGER_CANISTER_ID } from "../consts";

// Interface to structure raw data for broadcasting transactions
interface BroadcastRawData {
  encodedSignedCallBlob: string;
}

// Main broadcast function for handling Internet Computer transactions
export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { operation, rawData },
}) => {
  log("debug", "[broadcast] Internet Computer transaction broadcast initiated");

  // Type assertion and validation for rawData
  const rawDataTyped = rawData as unknown as BroadcastRawData;
  invariant(rawDataTyped, "[ICP](broadcast) Missing rawData");
  invariant(rawDataTyped.encodedSignedCallBlob, "[ICP](broadcast) Missing encodedSignedCallBlob");
  invariant(operation.extra, "[ICP](broadcast) Missing operation extra");

  await broadcastTxn(
    Buffer.from(rawDataTyped.encodedSignedCallBlob, "hex"),
    MAINNET_LEDGER_CANISTER_ID,
    "call",
  );

  return operation;
};
