import { InputEntryFunctionData } from "@aptos-labs/ts-sdk";
import { Operation } from "@ledgerhq/types-live";
import { Operation as APIOperation } from "@ledgerhq/coin-framework/api/types";
import { AptosAsset } from "../types/assets";
import {
  BATCH_TRANSFER_TYPES,
  COIN_TRANSFER_TYPES,
  DELEGATION_POOL_TYPES,
  FA_TRANSFER_TYPES,
} from "../constants";
import { compareAddress } from "./getCoinAndAmounts";

export function processRecipients(
  payload: InputEntryFunctionData,
  address: string,
  op: Operation | APIOperation<AptosAsset>,
  function_address: string,
): void {
  // get recipients buy 3 groups
  if (
    (COIN_TRANSFER_TYPES.includes(payload.function) ||
      DELEGATION_POOL_TYPES.includes(payload.function)) &&
    payload.functionArguments &&
    payload.functionArguments.length > 0 &&
    typeof payload.functionArguments[0] === "string"
  ) {
    // 1. Transfer like functions (includes some delegation pool functions)
    op.recipients.push(payload.functionArguments[0].toString());
  } else if (
    FA_TRANSFER_TYPES.includes(payload.function) &&
    payload.functionArguments &&
    payload.functionArguments.length > 1 &&
    typeof payload.functionArguments[0] === "object" &&
    typeof payload.functionArguments[1] === "string"
  ) {
    // 1. Transfer like functions (includes some delegation pool functions)
    op.recipients.push(payload.functionArguments[1].toString());
  } else if (
    BATCH_TRANSFER_TYPES.includes(payload.function) &&
    payload.functionArguments &&
    payload.functionArguments.length > 0 &&
    Array.isArray(payload.functionArguments[0])
  ) {
    // 2. Batch function, to validate we are in the recipients list
    if (!compareAddress(op.senders[0], address)) {
      for (const recipient of payload.functionArguments[0]) {
        if (recipient && compareAddress(recipient.toString(), address)) {
          op.recipients.push(recipient.toString());
        }
      }
    }
  } else {
    // 3. other smart contracts, in this case smart contract will be treated as a recipient
    op.recipients.push(function_address);
  }
}
