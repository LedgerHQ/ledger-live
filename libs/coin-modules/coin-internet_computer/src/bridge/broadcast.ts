import { log } from "@ledgerhq/logs";
import { AccountBridge } from "@ledgerhq/types-live";
import invariant from "invariant";
import { broadcastTxn } from "../api";
import { MAINNET_LEDGER_CANISTER_ID } from "../consts";
import { Transaction } from "../types";

// Interface to structure raw data for broadcasting transactions
interface BroadcastRawData {
  encodedSignedCallBlob: string;
}

// Type guard to validate rawData shape
function isBroadcastRawData(data: unknown): data is BroadcastRawData {
  return (
    typeof data === "object" &&
    data !== null &&
    "encodedSignedCallBlob" in data &&
    typeof (data as any).encodedSignedCallBlob === "string"
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

  await broadcastTxn(
    Buffer.from(rawData.encodedSignedCallBlob, "hex"),
    MAINNET_LEDGER_CANISTER_ID,
    "call",
  );

  return operation;
};
