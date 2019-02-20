// @flow
const aliases = {
  bitcoin_testnet: "bitcoin",
  bitcoin_cash: "bitcoin",
  bitcoin_gold: "bitcoin",
  ethereum: "ethereumClassic",
  ethereum_classic: "ethereumClassic",
  ethereum_ropsten: "ethereumClassic",
  poswallet: "posw"
};
export default (id: string) => aliases[id] || id;
