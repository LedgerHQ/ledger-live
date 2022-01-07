/* eslint-disable no-console */
var Benchmark = require("benchmark");
var { reduce } = require("rxjs/operators");
var { BigNumber } = require("bignumber.js");
var { getFiatCurrencyByTicker } = require("../lib/currencies");
var { fromAccountRaw } = require("../lib/account");
var portfolioV1 = require("../lib/portfolio");
var portfolioV2 = require("../lib/portfolio/v2");
var {
  initialState,
  calculate,
  loadCountervalues,
  inferTrackingPairForAccounts,
} = require("../lib/countervalues/logic");
// var { jsonFromFile } = require("../cli/lib/stream");

const cvCurrency = getFiatCurrencyByTicker("USD");

async function main() {
  const accountsRaw = await jsonFromFile("test-data/mere-denis.json")
    .pipe(reduce((acc, a) => acc.concat(a), []))
    .toPromise();
  const accounts = accountsRaw.map(fromAccountRaw);

  const cvState = await loadCountervalues(initialState, {
    trackingPairs: inferTrackingPairForAccounts(accounts, cvCurrency),
    autofillGaps: true,
  });

  const calc = (c, v, date) =>
    BigNumber(
      calculate(cvState, {
        date,
        value: v.toNumber(),
        from: c,
        to: cvCurrency,
      }) || 0
    );

  new Benchmark.Suite()
    .on("cycle", function (event) {
      console.log(String(event.target));
    })
    .on("complete", function () {
      console.log("Fastest is " + this.filter("fastest").map("name"));
    })
    .add("V1: getPortfolio", function () {
      portfolioV1.getPortfolio(accounts, "year", calc);
    })
    .add("V2: getPortfolio", function () {
      portfolioV2.getPortfolio(accounts, "year", cvState, cvCurrency);
    })
    .run();

  new Benchmark.Suite()
    .on("cycle", function (event) {
      console.log(String(event.target));
    })
    .on("complete", function () {
      console.log("Fastest is " + this.filter("fastest").map("name"));
    })
    .add("V1: getAssetsDistribution", function () {
      portfolioV1.getAssetsDistribution(accounts, calc);
    })
    .add("V2: getAssetsDistribution", function () {
      portfolioV2.getAssetsDistribution(accounts, cvState, cvCurrency);
    })
    .run();
}

main();
