// @flow
/* eslint-disable no-console */
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import { deviceOpt } from "../scan";
import { from } from "rxjs";
import invariant from "invariant";
import Btc from "@ledgerhq/hw-app-btc";
import network from "@ledgerhq/live-common/lib/network";
import { findCurrencyExplorer } from "@ledgerhq/live-common/lib/api/Ledger";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/lib/data/cryptocurrencies";

const command = async (transport, currencyId, hash) => {
  const btc = new Btc(transport);
  const currency = findCryptoCurrencyById(currencyId);
  invariant(currency, "currency not found");
  const { bitcoinLikeInfo } = currency;
  invariant(
    currency.family === "bitcoin" && bitcoinLikeInfo,
    "currency of bitcoin family only"
  );
  const ledgerExplorer = findCurrencyExplorer(currency);
  invariant(ledgerExplorer, "ledgerExplorer not found");
  const { endpoint, version, id } = ledgerExplorer;

  const res = await network({
    url: `${endpoint}/blockchain/${version}/${id}/transactions/${hash}/hex`,
  });

  const hex = res.data[0] && res.data[0].hex;

  if (!hex) return `Backend returned no hex for this hash`;

  const tx = btc.splitTransaction(
    hex,
    currency.supportsSegwit,
    bitcoinLikeInfo.hasTimestamp,
    true
  );

  const outHash = await btc.getTrustedInput(0, tx, [currency.id]);
  const ouHash = outHash.substring(8, 72);
  const finalOut = Buffer.from(ouHash, "hex").reverse().toString("hex");

  return { inHash: hash, finalOut };
};

export default {
  args: [
    deviceOpt,
    { name: "currency", alias: "c", type: String },
    { name: "hash", alias: "h", type: String },
  ],
  job: ({
    device,
    currency,
    hash,
  }: $Shape<{ device: string, currency: string, hash: string }>) =>
    withDevice(device || "")((transport) =>
      from(command(transport, currency, hash))
    ),
};
