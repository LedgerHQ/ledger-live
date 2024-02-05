import * as nearAPI from "near-api-js";
import { Action } from "near-api-js/lib/transaction";
import { Transaction as NearApiTransaction } from "near-api-js/lib/transaction";
import type { Account } from "@ledgerhq/types-live";
import {
  formatCurrencyUnit,
  getCryptoCurrencyById,
} from "@ledgerhq/coin-framework/currencies/index";
import type { Transaction } from "./types";
import { getAccessKey } from "./api";
import { getStakingGas } from "./logic";

export const buildTransaction = async (
  a: Account,
  t: Transaction,
  publicKey: string,
): Promise<NearApiTransaction> => {
  const { nonce, block_hash } = await getAccessKey({
    address: a.freshAddress,
    publicKey,
  });

  const currency = getCryptoCurrencyById("near");
  const formattedAmount = formatCurrencyUnit(currency.units[0], t.amount, {
    disableRounding: true,
    showAllDigits: true,
  });
  const parsedNearAmount = nearAPI.utils.format.parseNearAmount(formattedAmount);

  const actions: Action[] = [];

  switch (t.mode) {
    case "stake":
      actions.push(
        nearAPI.transactions.functionCall(
          "deposit_and_stake",
          {},
          getStakingGas().toNumber(),
          parsedNearAmount,
        ),
      );
      break;
    case "unstake":
      if (t.useAllAmount) {
        actions.push(
          nearAPI.transactions.functionCall("unstake_all", {}, getStakingGas().toNumber(), "0"),
        );
      } else {
        actions.push(
          nearAPI.transactions.functionCall(
            "unstake",
            { amount: parsedNearAmount },
            getStakingGas().toNumber(),
            "0",
          ),
        );
      }
      break;
    case "withdraw":
      if (t.useAllAmount) {
        actions.push(
          nearAPI.transactions.functionCall("withdraw_all", {}, getStakingGas(t).toNumber(), "0"),
        );
      } else {
        actions.push(
          nearAPI.transactions.functionCall(
            "withdraw",
            { amount: parsedNearAmount },
            getStakingGas().toNumber(),
            "0",
          ),
        );
      }
      break;
    default:
      actions.push(nearAPI.transactions.transfer(parsedNearAmount));
  }

  const transaction = nearAPI.transactions.createTransaction(
    a.freshAddress,
    nearAPI.utils.PublicKey.fromString(publicKey),
    t.recipient,
    nonce + 1,
    actions,
    nearAPI.utils.serialize.base_decode(block_hash),
  );

  return transaction;
};
