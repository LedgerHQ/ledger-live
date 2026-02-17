import { InputEntryFunctionData } from "@aptos-labs/ts-sdk";
import { Operation as APIOperation } from "@ledgerhq/coin-framework/api/types";
import { Operation } from "@ledgerhq/types-live";
import {
  BATCH_TRANSFER_TYPES,
  COIN_TRANSFER_TYPES,
  DELEGATION_POOL_TYPES,
  FA_TRANSFER_TYPES,
} from "../constants";
import { compareAddress } from "./getCoinAndAmounts";
import { normalizeAddress } from "./normalizeAddress";

const transferLikeFunctions = (payload: InputEntryFunctionData) =>
  COIN_TRANSFER_TYPES.includes(payload.function) ||
  DELEGATION_POOL_TYPES.includes(payload.function);

const addLikeFunctionsToRecipients = (
  op: Operation | APIOperation,
  payload: InputEntryFunctionData,
) => {
  if (
    payload.functionArguments &&
    payload.functionArguments.length > 0 &&
    typeof payload.functionArguments[0] === "string"
  ) {
    op.recipients.push(normalizeAddress(payload.functionArguments[0]));
  }
};

const addFungibleToRecipients = (op: Operation | APIOperation, payload: InputEntryFunctionData) => {
  if (
    payload.functionArguments &&
    payload.functionArguments.length > 1 &&
    typeof payload.functionArguments[0] === "object" &&
    typeof payload.functionArguments[1] === "string"
  ) {
    op.recipients.push(normalizeAddress(payload.functionArguments[1].toString()));
  }
};

const addBatchedFunctions = (
  op: Operation | APIOperation,
  payload: InputEntryFunctionData,
  address: string,
) => {
  if (
    !(
      payload.functionArguments &&
      payload.functionArguments.length > 0 &&
      Array.isArray(payload.functionArguments[0])
    )
  ) {
    return;
  }
  for (const recipient of payload.functionArguments[0]) {
    if (recipient && compareAddress(recipient.toString(), address)) {
      op.recipients.push(normalizeAddress(recipient.toString()));
    }
  }
};

export function processRecipients(
  payload: InputEntryFunctionData,
  address: string,
  op: Operation | APIOperation,
  function_address: string,
): void {
  // get recipients by 3 groups
  if (transferLikeFunctions(payload)) {
    // 1. Transfer like functions (includes some delegation pool functions)
    addLikeFunctionsToRecipients(op, payload);
  } else if (FA_TRANSFER_TYPES.includes(payload.function)) {
    // 1. Transfer like functions (includes some delegation pool functions)
    addFungibleToRecipients(op, payload);
  } else if (BATCH_TRANSFER_TYPES.includes(payload.function)) {
    // 2. Batch function, to validate we are in the recipients list
    if (!compareAddress(op.senders[0], address)) {
      addBatchedFunctions(op, payload, address);
    }
  } else {
    // 3. other smart contracts, in this case smart contract will be treated as a recipient
    op.recipients.push(function_address);
  }
}
