// @flow
/* eslint-disable no-console */

const { log, listen } = require("@ledgerhq/logs");
const zip = require("lodash/zip");
const chunk = require("lodash/chunk");
const {
  listTokensForCryptoCurrency,
  getCryptoCurrencyById,
  getFiatCurrencyByTicker,
} = require("../lib/currencies");
const api = require("../lib/countervalues/api").default;
const network = require("../lib/network").default;
const { delay } = require("../lib/promise");

const ethereum = getCryptoCurrencyById("ethereum");
const usd = getFiatCurrencyByTicker("USD");

async function fetchPriceFromEtherscan(token) {
  const { data } = await network({
    method: "GET",
    url: `https://etherscan.io/token/${token.contractAddress}`,
  });
  let str = data.replace(/\s/g, "");
  const prefix = 'Price</span></div><spanclass="d-block">';
  const i = str.indexOf(prefix);
  if (i === -1) return;
  str = str.slice(i + prefix.length);
  const j = str.indexOf("<");
  str = str.slice(0, j);
  if (str[0] !== "$") return;
  str = str.slice(1).replace(",", "");
  const value = parseFloat(str);
  if (isNaN(value)) return;
  return value;
}

if (process.env.VERBOSE) {
  listen((l) => console.log(JSON.stringify(l)));
}

// types:
// - no-etherscan: this token have a countervalue but etherscan don't. It might mean we wrongly value this token. We could consider disabling it.
// - wrongly-disabled: we disable the token and it probably should be safe to enable it back because etherscan gives a value that would correspond to our api.
// - suggest-ticker: we probably use a wrong ticker, we should consider using the one suggested as it's used by our countervalue provider.
// - mismatch: the price differs highly between ours and etherscan.
// - missing-countervalue: our countervalues provider don't seem to have countervalue even tho etherscan do

async function main() {
  const tokens = listTokensForCryptoCurrency(ethereum);
  const { data: assets } = await network({
    method: "GET",
    url: "http://reference-data-api.kaiko.io/v1/assets",
  });
  function findSuggestedAsset(token) {
    const id = `${token.id} (${token.contractAddress})`;
    const m = assets.data.find(
      (d) =>
        d.name.toLowerCase().replace(/\s/g, "") ===
        token.name.toLowerCase().replace(/\s/g, "")
    );
    if (m && token.ticker.toLowerCase() !== m.code) {
      return { type: "suggest-ticker", id, code: m.code };
    }
  }
  for (const c of chunk(tokens, 5)) {
    const latest = await api.fetchLatest(c.map((from) => ({ from, to: usd })));
    const etherscan = await Promise.all(c.map(fetchPriceFromEtherscan));
    zip(latest, etherscan, c)
      .map(([ours, theirs, token]) => {
        log("check", `${c.id} ${latest || 0} ${etherscan || 0}`);
        if (!ours && !theirs) return;
        const id = `${token.id} (${token.contractAddress})`;
        const suggestedAsset = findSuggestedAsset(token);
        if (ours && !theirs) {
          if (suggestedAsset) return suggestedAsset;
          if (!token.disableCountervalue) {
            return { type: "no-etherscan", id };
          }
        } else if (!ours && theirs) {
          if (suggestedAsset) return suggestedAsset;
          if (!token.disableCountervalue) {
            return { type: "missing-countervalue", id };
          }
        } else {
          const ratio = ours > theirs ? ours / theirs : theirs / ours;
          if (ratio > 5) {
            if (suggestedAsset) return suggestedAsset;
            if (!token.disableCountervalue) {
              return { type: "mismatch", id, ours, theirs };
            }
          } else if (token.disableCountervalue) {
            if (suggestedAsset) return suggestedAsset;
            return { type: "wrongly-disabled", id, ours, theirs };
          } else {
            return; // all good
          }
        }
      })
      .map((log) => {
        if (log) console.log(JSON.stringify(log));
      });
    await delay(3000);
  }
  console.log("finished to run on " + tokens.length + " tokens");
}

main();
