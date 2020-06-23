// @flow
import type { Account } from "../../types";
import type { BitcoinOutput, BitcoinInput } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import { getEnv } from "../../env";

const sortUTXO = (a, b) => b.value.minus(a.value).toNumber();

export function formatInput(account: Account, input: BitcoinInput) {
  return `${(input.value
    ? formatCurrencyUnit(account.unit, input.value, {
        showCode: false,
      })
    : ""
  ).padEnd(12)} ${input.address || ""} ${input.previousTxHash || ""}@${
    input.previousOutputIndex
  }`;
}

export function formatOutput(account: Account, o: BitcoinOutput) {
  return `${formatCurrencyUnit(account.unit, o.value, {
    showCode: false,
  }).padEnd(12)} ${o.address || ""} ${o.path || ""} ${o.hash}@${
    o.outputIndex
  } (${o.blockHeight ? account.blockHeight - o.blockHeight : 0})`;
}

function formatAccountSpecifics(account: Account): string {
  if (!account.bitcoinResources) return "";
  const { utxos } = account.bitcoinResources;
  let str = `\n${utxos.length} UTXOs`;
  const n = getEnv("DEBUG_UTXO_DISPLAY");
  const displayAll = utxos.length <= n;
  str += utxos
    .slice(0)
    .sort(sortUTXO)
    .slice(0, displayAll ? utxos.length : n)
    .map((utxo) => `\n${formatOutput(account, utxo)}`)
    .join("");
  if (!displayAll) {
    str += "\n...";
  }
  return str;
}

export default { formatAccountSpecifics };
