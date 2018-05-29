// @flow
const aliases = {
  bitcoin_testnet: "bitcoin",
  bitcoin_cash: "bitcoin",
  bitcoin_gold: "bitcoin",
  ethereum: "ethereumClassic",
  ethereum_classic: "ethereumClassic",
  ethereum_testnet: "ethereumClassic"
};
export default (id: string) => aliases[id] || id;
