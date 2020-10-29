// @flow
/* eslint-disable no-console */

const { BigNumber } = require("bignumber.js");
const axios = require("axios");
const { getCryptoCurrencyById } = require("../lib/currencies");
const { apiForCurrency } = require("../lib/api/Ethereum");
const { getEstimatedFees } = require("../lib/api/Fees");

const ethereum = getCryptoCurrencyById("ethereum");

function asRoundedGwei(wei) {
  return BigNumber(wei).div(1000000000).integerValue().toNumber();
}

const head = [
  "date",
  "nodeGasPrice",
  "ledgerLow",
  "ledgerMedium",
  "ledgerHigh",
  "etherscan.SafeGasPrice",
  "etherscan.ProposeGasPrice",
  "etherscan.FastGasPrice",
  "safeLow",
  "average",
  "fast",
  "fastest",
];

async function main() {
  const api = apiForCurrency(ethereum);

  const date = new Date().toISOString();
  const [
    gasTracker,
    estimatedFees,
    etherscanR,
    ethgasstationR,
  ] = await Promise.all([
    api.getGasTrackerBarometer(),
    getEstimatedFees(ethereum),
    axios(
      "https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=" +
        process.env.ETHERSCAN_API
    ),
    axios("https://ethgasstation.info/api/ethgasAPI.json"),
  ]);

  const etherscan = etherscanR.data.result;
  const ethgasstation = ethgasstationR.data;

  const row = [
    date,
    asRoundedGwei(estimatedFees.gas_price),
    asRoundedGwei(gasTracker.low),
    asRoundedGwei(gasTracker.medium),
    asRoundedGwei(gasTracker.high),
    etherscan.SafeGasPrice,
    etherscan.ProposeGasPrice,
    etherscan.FastGasPrice,
    ethgasstation.safeLow,
    ethgasstation.average,
    ethgasstation.fast,
    ethgasstation.fastest,
  ];

  console.log(row.join(" "));
}

console.log(head.join(" "));
main();
setInterval(main, 60 * 1000);
