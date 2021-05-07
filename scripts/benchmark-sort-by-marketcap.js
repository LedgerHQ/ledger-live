/* eslint-disable no-console */
var Benchmark = require("benchmark");
var { listCryptoCurrencies, listTokens } = require("../lib/currencies");
var {
  sortByMarketcapV1,
  sortByMarketcapV2,
} = require("../lib/currencies/sortByMarketcap");
var { getBTCValues } = require("../lib/countervalues/mock");

const full = listCryptoCurrencies().concat(listTokens({ withDelisted: true }));
const listed = listCryptoCurrencies().concat(listTokens());
const tickers = Object.keys(getBTCValues());

const suite = new Benchmark.Suite();

console.log(full.length + " full total currencies & tokens");
console.log(listed.length + " listed total currencies & tokens");
console.log(tickers.length + " tickers");

suite
  .add("sortByMarketcapV1 full", function () {
    sortByMarketcapV1(full, tickers);
  })
  .add("sortByMarketcapV2 full", function () {
    sortByMarketcapV2(full, tickers);
  })
  .add("sortByMarketcapV1 listed", function () {
    sortByMarketcapV1(listed, tickers);
  })
  .add("sortByMarketcapV2 listed", function () {
    sortByMarketcapV2(listed, tickers);
  })
  .on("cycle", function (event) {
    console.log(String(event.target));
  })
  .on("complete", function () {
    console.log("Fastest is " + this.filter("fastest").map("name"));
  })
  .run();
