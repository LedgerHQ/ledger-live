import { log } from "@ledgerhq/logs";
import { AccountBridge } from "@ledgerhq/types-live";
import invariant from "invariant";
import { broadcastTxn, ensureTransferCallAccepted } from "../api";
import { MAINNET_LEDGER_CANISTER_ID } from "../consts";
import { Transaction } from "../types";

interface BroadcastRawData {
  encodedSignedCallBlob: string;
  transferRequestIdHex: string;
}

function isBroadcastRawData(data: unknown): data is BroadcastRawData {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  return (
    "encodedSignedCallBlob" in data &&
    typeof data.encodedSignedCallBlob === "string" &&
    "transferRequestIdHex" in data &&
    typeof data.transferRequestIdHex === "string"
  );
}

// Main broadcast function for handling Internet Computer transactions
export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { operation, rawData },
}) => {
  log("debug", "[broadcast] Internet Computer transaction broadcast initiated");

  // Validate rawData with type guard
  invariant(isBroadcastRawData(rawData), "[ICP](broadcast) Invalid rawData format");
  invariant(operation.extra, "[ICP](broadcast) Missing operation extra");

  const syncCallResponse = await broadcastTxn(
    Buffer.from(rawData.encodedSignedCallBlob, "hex"),
    MAINNET_LEDGER_CANISTER_ID,
    "call",
  );
  await ensureTransferCallAccepted(syncCallResponse, rawData.transferRequestIdHex);

  return operation;
};
