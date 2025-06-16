import { BroadcastFnSignature } from "@ledgerhq/types-live";
import invariant from "invariant";
import { broadcastTransaction } from "./api/network";
import { PactCommandObject } from "./hw-app-kda/Kadena";
import { KadenaOperation } from "./types";

export const broadcast: BroadcastFnSignature = async ({
  signedOperation: { operation, rawData },
}) => {
  invariant(rawData, "rawData is required");

  const pactCmd = rawData["pact_command"] as PactCommandObject;
  invariant(pactCmd, "pactCmd is required");

  await broadcastTransaction(pactCmd, operation as KadenaOperation);

  const result = { ...operation };

  return result;
};

export default broadcast;
