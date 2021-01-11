// @flow
/* eslint-disable no-console */

const zip = require("lodash/zip");
const chunk = require("lodash/chunk");
const {
  listTokensForCryptoCurrency,
  getCryptoCurrencyById,
  getFiatCurrencyByTicker,
} = require("../lib/currencies");
const api = require("../lib/countervalues/api").default;
const network = require("../lib/network").default;

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
  str = str.slice(1);
  const value = parseFloat(str);
  if (isNaN(value)) return;
  return value;
}

async function main() {
  const tokens = listTokensForCryptoCurrency(ethereum);
  for (const c of chunk(tokens, 10)) {
    const latest = await api.fetchLatest(c.map((from) => ({ from, to: usd })));
    const etherscan = await Promise.all(c.map(fetchPriceFromEtherscan));
    zip(latest, etherscan, c).forEach(([ours, theirs, token]) => {
      if (!ours && !theirs) return;
      const id = `${token.id} (${token.contractAddress})`;
      if (ours && !theirs) {
        console.log(`${id} in countervalues, but not in etherscan`);
      } else if (!ours && theirs) {
        console.log(`${id} in etherscan, not ours`);
      } else {
        const ratio = ours > theirs ? ours / theirs : theirs / ours;
        if (ratio > 5) {
          console.log(`${id}: PRICE MISMATCH! $${ours} vs $${theirs}`);
        } else if (token.disableCountervalue) {
          console.log(
            `${id}: token is disabled! but it looks alright. we could enable it back. ${ours} looks close enough to ${theirs}`
          );
        }
      }
    });
  }
  console.log("finished to run on " + tokens.length + " tokens");
}

main();
