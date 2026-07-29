import { BigNumber } from "bignumber.js";
import type { Balance } from "@ledgerhq/coin-module-framework/api/index";
import type { BitcoinOutput } from "../../types/bridge";
import type { ZcashPrivateInfo } from "../../network/types";
import { fetchTransparentTxs } from "../../network/explorer";
import { isTransparentZcashAddress } from "../validateAddress";

type PrivateBalances = Pick<ZcashPrivateInfo, "orchardBalance" | "saplingBalance">;

const NATIVE_ASSET = { type: "native", name: "ZEC" } as const;

/**
 * Transparent balance = sum of the account's unspent transparent UTXOs.
 *
 * Kept independent from `account.balance` (which holds the transparent + private
 * total) so the two syncs can recompute the total without double-counting the
 * shielded funds.
 */
export function getTransparentBalance(
  utxos: Pick<BitcoinOutput, "value">[] | undefined,
): BigNumber {
  return (utxos ?? []).reduce((sum, utxo) => sum.plus(utxo.value), new BigNumber(0));
}

/** Private (shielded) balance = orchard + sapling. */
export function getPrivateBalance(privateInfo: PrivateBalances | undefined | null): BigNumber {
  if (!privateInfo) return new BigNumber(0);
  return (privateInfo.orchardBalance ?? new BigNumber(0)).plus(
    privateInfo.saplingBalance ?? new BigNumber(0),
  );
}

/** Total balance shown to the user = transparent + private. */
export function computeZcashBalance(
  transparentBalance: BigNumber,
  privateInfo: PrivateBalances | undefined | null,
): BigNumber {
  return transparentBalance.plus(getPrivateBalance(privateInfo));
}

/**
 * Balance of a single Zcash address.
 *
 * A transparent address holds no notes, so its unspent outputs are its whole
 * balance and the figure is exact. A unified address is refused instead of
 * answered: its shielded receivers hold value that no address-indexed source
 * can see (notes are encrypted to a viewing key), so an answer built from the
 * transparent receiver alone would understate the balance while looking
 * complete. The account path reports that total, holding the UFVK and composing
 * it with `computeZcashBalance` above -- the arithmetic lives here once, for
 * both callers.
 *
 * The explorer serves history, not a UTXO set, so the set is folded out of the
 * address's transactions: every output paid to the address, minus those a later
 * transaction spends. That requires the full history, hence the paging loop --
 * a transaction confirmed at any height may spend an output received long
 * before it.
 */
export async function getBalance(address: string): Promise<Balance[]> {
  if (!isTransparentZcashAddress(address)) {
    throw new Error(
      "getBalance is not supported for shielded or unified addresses: Zcash shielded balances require a viewing key",
    );
  }

  const unspent = new Map<string, BigNumber>();
  let token: string | null = null;

  do {
    const page = await fetchTransparentTxs(address, { token });

    // Ascending order, and no transaction spends its own outputs, so removing
    // what a transaction consumes before adding what it creates is sound.
    for (const tx of page.txs) {
      for (const input of tx.inputs) {
        if (input.output_hash) unspent.delete(`${input.output_hash}-${input.output_index}`);
      }
      for (const output of tx.outputs) {
        if (output.address === address) {
          unspent.set(`${output.output_hash}-${output.output_index}`, new BigNumber(output.value));
        }
      }
    }

    // A token that does not move would page forever.
    token = page.next === token ? null : page.next;
  } while (token);

  const total = [...unspent.values()].reduce((sum, value) => sum.plus(value), new BigNumber(0));

  return [{ value: BigInt(total.toFixed(0)), asset: NATIVE_ASSET }];
}
