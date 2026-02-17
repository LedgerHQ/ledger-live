import { EntryFunctionPayloadResponse, InputEntryFunctionData } from "@aptos-labs/ts-sdk";
import { Operation } from "@ledgerhq/coin-framework/api/types";
import BigNumber from "bignumber.js";
import { APTOS_ASSET_ID, OP_TYPE } from "../constants";
import { AptosTransaction } from "../types";
import { calculateAmount } from "./calculateAmount";
import { compareAddress, getCoinAndAmounts } from "./getCoinAndAmounts";
import { getFunctionAddress } from "./getFunctionAddress";
import { normalizeAddress } from "./normalizeAddress";
import { processRecipients } from "./processRecipients";

export const convertFunctionPayloadResponseToInputEntryFunctionData = (
  payload: EntryFunctionPayloadResponse,
): InputEntryFunctionData => ({
  function: payload.function,
  typeArguments: payload.type_arguments,
  functionArguments: payload.arguments,
});

const detectType = (address: string, tx: AptosTransaction, value: BigNumber): OP_TYPE => {
  let type = compareAddress(tx.sender, address) ? OP_TYPE.OUT : OP_TYPE.IN;

  if (!value) {
    // skip transaction that result no Aptos change
    type = OP_TYPE.UNKNOWN;
  }

  return type;
};

const getTokenType = (coin_id: string) => {
  const parts = coin_id.split("::");
  if (parts.length === 3) {
    return "coin";
  }
  return "fungible_asset";
};

export function transactionsToOperations(
  address: string,
  txs: (AptosTransaction | null)[],
): Operation[] {
  const operations: Operation[] = [];

  return txs.reduce((acc, tx) => {
    if (tx === null) {
      return acc;
    }

    const payload = convertFunctionPayloadResponseToInputEntryFunctionData(
      tx.payload as EntryFunctionPayloadResponse,
    );

    const function_address = getFunctionAddress(payload);

    if (!function_address) {
      return acc; // skip transaction without functions in payload
    }

    const { coin_id, amount_in, amount_out } = getCoinAndAmounts(tx, address);
    const value = calculateAmount(tx.sender, address, amount_in, amount_out);
    const type = detectType(address, tx, value);

    const op: Operation = {
      id: tx.hash,
      type,
      senders: [],
      recipients: [],
      value: BigInt(0),
      asset: { type: "native" },
      details: {
        hasFailed: !tx.success,
      },
      tx: {
        hash: tx.hash,
        block: {
          height: tx.block.height,
          hash: tx.block.hash,
          time: new Date(parseInt(tx.timestamp) / 1000),
        },
        fees: BigInt(0),
        date: new Date(parseInt(tx.timestamp) / 1000),
        failed: !tx.success,
      },
    };

    const fees = new BigNumber(tx.gas_used).multipliedBy(new BigNumber(tx.gas_unit_price));
    op.tx.fees = BigInt(fees.toString());

    op.value = BigInt(value.isNaN() ? 0 : value.toString());
    op.senders.push(normalizeAddress(tx.sender));

    processRecipients(payload, address, op, function_address);

    if (op.type !== OP_TYPE.UNKNOWN && coin_id !== null) {
      if (coin_id === APTOS_ASSET_ID) {
        acc.push(op);
        return acc;
      } else {
        op.asset = {
          type: getTokenType(coin_id),
          assetReference: coin_id,
        };
        acc.push(op);
      }
    }
    return acc;
  }, operations);
}
