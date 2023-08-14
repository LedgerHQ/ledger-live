import type { BitcoinOutput, BitcoinInput, BitcoinAccount } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import { getEnv } from "../../env";
import { perCoinLogic } from "./logic";

const sortUTXO = (a, b) => b.value.minus(a.value).toNumber();

function injectGetAddressParams(account: BitcoinAccount): any {
  const perCoin = perCoinLogic[account.currency.id];

  if (perCoin && perCoin.injectGetAddressParams) {
    return perCoin.injectGetAddressParams(account);
  }
}

export function formatInput(account: BitcoinAccount, input: BitcoinInput): string {
  return `${(input.value
    ? formatCurrencyUnit(account.unit, input.value, {
        showCode: false,
      })
    : ""
  ).padEnd(12)} ${input.address || ""} ${input.previousTxHash || ""}@${input.previousOutputIndex}`;
}
export function formatOutput(account: BitcoinAccount, o: BitcoinOutput): string {
  return [
    formatCurrencyUnit(account.unit, o.value, {
      showCode: false,
    }).padEnd(12),
    o.address,
    o.isChange ? "(change)" : "",
    o.rbf ? "rbf" : "",
    o.hash,
    `@${o.outputIndex} (${o.blockHeight ? account.blockHeight - o.blockHeight : 0})`,
  ]
    .filter(Boolean)
    .join(" ");
}

function formatAccountSpecifics(account: BitcoinAccount): string {
  if (!account.bitcoinResources) return "";
  const { utxos } = account.bitcoinResources;
  let str = `\n${utxos.length} UTXOs`;
  const n = getEnv("DEBUG_UTXO_DISPLAY");
  const displayAll = utxos.length <= n;
  str += utxos
    .slice(0)
    .sort(sortUTXO)
    .slice(0, displayAll ? utxos.length : n)
    .map(utxo => `\n${formatOutput(account, utxo)}`)
    .join("");

  if (!displayAll) {
    str += "\n...";
  }

  return str;
}

export default {
  injectGetAddressParams,
  formatAccountSpecifics,
};
