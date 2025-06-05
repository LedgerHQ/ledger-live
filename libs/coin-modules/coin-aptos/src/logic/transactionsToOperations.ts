import { AptosTransaction } from "../types";
import { Operation } from "@ledgerhq/coin-framework/api/types";
import { AptosAsset } from "../types/assets";
import BigNumber from "bignumber.js";
import { EntryFunctionPayloadResponse, InputEntryFunctionData } from "@aptos-labs/ts-sdk";
import { APTOS_ASSET_ID, DIRECTION } from "../constants";
import { compareAddress, getCoinAndAmounts } from "./getCoinAndAmounts";
import { calculateAmount } from "./calculateAmount";
import { processRecipients } from "./processRecipients";
import { getFunctionAddress } from "./getFunctionAddress";
import { normalizeAddress } from "./normalizeAddress";

export const convertFunctionPayloadResponseToInputEntryFunctionData = (
  payload: EntryFunctionPayloadResponse,
): InputEntryFunctionData => ({
  function: payload.function,
  typeArguments: payload.type_arguments,
  functionArguments: payload.arguments,
});

const detectType = (address: string, tx: AptosTransaction, value: BigNumber): DIRECTION => {
  let type = compareAddress(tx.sender, address) ? DIRECTION.OUT : DIRECTION.IN;

  if (!value) {
    // skip transaction that result no Aptos change
    type = DIRECTION.UNKNOWN;
  }

  return type;
};

const getTokenStandard = (coin_id: string): string => {
  const parts = coin_id.split("::");
  if (parts.length === 3) {
    return "coin";
  }
  return "fungible_asset";
};

export function transactionsToOperations(
  address: string,
  txs: (AptosTransaction | null)[],
): Operation<AptosAsset>[] {
  const operations: Operation<AptosAsset>[] = [];

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

    const op: Operation<AptosAsset> = {
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
        block: { height: 0 },
        fees: BigInt(0),
        date: new Date(parseInt(tx.timestamp) / 1000),
      },
    };

    const fees = new BigNumber(tx.gas_used).multipliedBy(new BigNumber(tx.gas_unit_price));
    op.tx.fees = BigInt(fees.toString());

    op.value = BigInt(value.isNaN() ? 0 : value.toString());
    op.senders.push(normalizeAddress(tx.sender));

    processRecipients(payload, address, op, function_address);

    if (op.type !== DIRECTION.UNKNOWN && coin_id !== null) {
      if (coin_id === APTOS_ASSET_ID) {
        acc.push(op);
        return acc;
      } else {
        op.asset = {
          type: "token",
          standard: getTokenStandard(coin_id),
          contractAddress: coin_id,
        };
        acc.push(op);
      }
    }
    return acc;
  }, operations);
}
