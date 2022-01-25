// @flow
/* eslint-disable no-console */

// $FlowFixMe install axios yourself :D
const axios = require("axios");
const {
  listCryptoCurrencies,
  formatCurrencyUnit
  // $FlowFixMe
} = require("../lib/helpers/currencies");

const { COUNTERVALUE_API, AMOUNT } = process.env;

function main() {
  if (!COUNTERVALUE_API) {
    console.error("COUNTERVALUE_API env is required");
    process.exit(1);
    return;
  }

  const amount = parseFloat(AMOUNT || "1");

  const currencies = listCryptoCurrencies();

  axios
    .post(COUNTERVALUE_API + "/rates/daily", {
      pairs: currencies
        .map(c => ({
          from: c.ticker,
          to: "USD"
        }))
        .concat(
          currencies.filter(c => c.id !== "bitcoin").map(c => ({
            from: c.ticker,
            to: "BTC"
          }))
        )
    })
    .then(res => {
      function getRate(from, to) {
        const r = res.data[to][from] || {};
        const [exchange] = Object.keys(r);
        return (r[exchange] || { latest: 0 }).latest;
      }
      const btcRate = getRate("BTC", "USD");
      console.log("::: PRICE FOR USD " + amount.toFixed(2) + " :::");
      currencies.forEach(c => {
        const rate =
          getRate(c.ticker, "USD") || btcRate * getRate(c.ticker, "BTC");
        const price = formatCurrencyUnit(c.units[0], (amount * 100) / rate);
        console.log(c.ticker + "\t" + price);
      });
    })
    .catch(e => {
      console.error(e);
      process.exit(1);
    });
}

main();
