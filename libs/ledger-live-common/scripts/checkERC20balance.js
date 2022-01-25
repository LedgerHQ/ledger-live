// @flow
/* eslint-disable no-console */

const chunk = require("lodash/chunk");
const {
  listTokensForCryptoCurrency,
  getCryptoCurrencyById,
} = require("../lib/currencies");
const { apiForCurrency } = require("../lib/api/Ethereum");

const ethereum = getCryptoCurrencyById("ethereum");

async function main() {
  const api = apiForCurrency(ethereum);
  const tokens = listTokensForCryptoCurrency(ethereum, { withDelisted: true });
  const address = "0xabf06640f8ca8fc5e0ed471b10befcdf65a33e43";
  for (const c of chunk(tokens, 20)) {
    const balances = await api.getERC20Balances(
      c.map((t) => ({ address, contract: t.contractAddress }))
    );
    c.filter(
      (t) =>
        !balances.find(
          (b) =>
            b.contract &&
            b.contract.toLowerCase() === t.contractAddress.toLowerCase()
        )
    ).forEach((t) => {
      console.log(t.id || t);
    });
  }
  console.log("finished to run on " + tokens.length + " tokens");
}

main();
