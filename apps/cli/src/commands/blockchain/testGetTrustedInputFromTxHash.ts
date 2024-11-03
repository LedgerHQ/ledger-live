/* eslint-disable no-console */
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { DeviceCommonOpts, deviceOpt } from "../../scan";
import { from } from "rxjs";
import invariant from "invariant";
import Btc from "@ledgerhq/hw-app-btc";
import network from "@ledgerhq/live-network/network";
import { findCurrencyExplorer } from "@ledgerhq/live-common/explorer";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import Transport from "@ledgerhq/hw-transport";

const command = async (transport: Transport, currencyId: string, hash: string) => {
  const currency = findCryptoCurrencyById(currencyId);
  invariant(currency, "currency not found");
  if (!currency) throw new Error("currency not found");
  const { bitcoinLikeInfo } = currency;
  const btc = new Btc({ transport, currency: currency?.id });
  invariant(currency.family === "bitcoin" && bitcoinLikeInfo, "currency of bitcoin family only");
  const ledgerExplorer = findCurrencyExplorer(currency);
  invariant(ledgerExplorer, "ledgerExplorer not found");
  if (!ledgerExplorer) throw new Error("ledgerExplorer not found");
  const { endpoint, version, id } = ledgerExplorer;
  const res = await network({
    url: `${endpoint}/blockchain/${version}/${id}/transactions/${hash}/hex`,
  });
  const hex = res.data[0] && res.data[0].hex;
  if (!hex) return `Backend returned no hex for this hash`;
  const hasExtraData =
    currency.id === "zcash" || currency.id === "komodo" || currency.id === "zencash";
  const tx = btc.splitTransaction(hex, currency.supportsSegwit, hasExtraData, [currency.id]);
  const outHash = await btc.getTrustedInput(0, tx, [currency.id]);
  const ouHash = outHash.substring(8, 72);
  const finalOut = Buffer.from(ouHash, "hex").reverse().toString("hex");
  return {
    inHash: hash,
    finalOut,
  };
};

export type TestGetTrustedInputFromTxHashJobOpts = DeviceCommonOpts & {
  currency: string;
  hash: string;
};

export default {
  args: [
    deviceOpt,
    {
      name: "currency",
      alias: "c",
      type: String,
    },
    {
      name: "hash",
      alias: "h",
      type: String,
    },
  ],
  job: ({ device, currency, hash }: TestGetTrustedInputFromTxHashJobOpts) =>
    withDevice(device || "")(transport => from(command(transport, currency, hash))),
};
