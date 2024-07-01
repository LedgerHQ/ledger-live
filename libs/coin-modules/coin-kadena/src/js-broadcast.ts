import { BroadcastFnSignature } from "@ledgerhq/types-live";
import { broadcastTransaction } from "./api/network";
import invariant from "invariant";
import { PactCommandObject } from "./hw-app-kda/Kadena";
import { KadenaOperation } from "./types";

export const broadcast: BroadcastFnSignature = async ({
  signedOperation: { operation, rawData },
}) => {
  // log("debug", "[broadcast] start fn");

  invariant(rawData, "rawData is required");

  const pactCmd = rawData["pact_command"] as PactCommandObject;
  invariant(pactCmd, "pactCmd is required");

  await broadcastTransaction(pactCmd, operation as KadenaOperation);

  const result = { ...operation };

  return result;
};

export default broadcast;
