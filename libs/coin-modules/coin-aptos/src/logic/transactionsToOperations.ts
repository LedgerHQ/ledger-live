import { AptosTransaction } from "../types";
import { Operation } from "@ledgerhq/coin-framework/api/types";
import { AptosAsset } from "../types/assets";
import BigNumber from "bignumber.js";
import { EntryFunctionPayloadResponse, InputEntryFunctionData } from "@aptos-labs/ts-sdk";
import { APTOS_ASSET_ID, DIRECTION } from "../constants";
import { compareAddress, getCoinAndAmounts } from "./getCoinAndAmounts";
import { calculateAmount } from "./calculateAmount";
import { findTokenByAddressInCurrency } from "@ledgerhq/cryptoassets/index";
import { processRecipients } from "./processRecipients";
import { getFunctionAddress } from "./getFunctionAddress";

export const convertFunctionPayloadResponseToInputEntryFunctionData = (
  payload: EntryFunctionPayloadResponse,
): InputEntryFunctionData => ({
  function: payload.function,
  typeArguments: payload.type_arguments,
  functionArguments: payload.arguments,
});

export function transactionsToOperations(
  address: string,
  txs: (AptosTransaction | null)[],
): [Operation<AptosAsset>[], Operation<AptosAsset>[]] {
  const ops: Operation<AptosAsset>[] = [];
  const opsTokens: Operation<AptosAsset>[] = [];

  txs.forEach(tx => {
    if (tx === null) {
      return;
    }

    const op: Operation<AptosAsset> = {
      id: tx.hash,
      type: compareAddress(tx.sender, address) ? DIRECTION.OUT : DIRECTION.IN,
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
        date: new Date(),
      },
    };

    const payload = convertFunctionPayloadResponseToInputEntryFunctionData(
      tx.payload as EntryFunctionPayloadResponse,
    );

    const function_address = getFunctionAddress(payload);

    if (!function_address) {
      return; // skip transaction without functions in payload
    }

    const fees = new BigNumber(tx.gas_used).multipliedBy(new BigNumber(tx.gas_unit_price));
    op.tx.fees = BigInt(fees.toString());

    const { coin_id, amount_in, amount_out } = getCoinAndAmounts(tx, address);
    const value = calculateAmount(tx.sender, address, amount_in, amount_out);
    op.value = BigInt(value.isNaN() ? 0 : value.toString());
    op.senders.push(tx.sender);

    processRecipients(payload, address, op, function_address);

    if (!op.value) {
      // skip transaction that result no Aptos change
      op.type = DIRECTION.UNKNOWN;
    }

    if (op.type !== DIRECTION.UNKNOWN && coin_id !== null) {
      if (coin_id === APTOS_ASSET_ID) {
        ops.push(op);
      } else {
        const token = findTokenByAddressInCurrency(coin_id.toLowerCase(), "aptos");

        if (token !== undefined) {
          opsTokens.push(op);

          if (op.type === DIRECTION.OUT) {
            ops.push({
              ...op,
              value: op.tx.fees,
              type: "FEES",
            });
          }
        }
      }
    }
  });

  return [ops, opsTokens];
}
