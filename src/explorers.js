// @flow

import type { Account, Operation, CryptoCurrencyConfig } from "./types";

type Explorer = string => ?string;

export const defaultExplorers: CryptoCurrencyConfig<Explorer> = {
  akroma: hash => `https://akroma.io/explorer/transaction/${hash}`,
  ark: hash => `https://explorer.ark.io/transaction/${hash}`,
  bitcoin_cash: hash => `https://bitcoincash.blockexplorer.com/tx/${hash}`,
  bitcoin_gold: hash => `https://btgexplorer.com/tx/${hash}`,
  bitcoin_private: hash => `https://explorer.btcprivate.org/tx/${hash}`,
  bitcoin_testnet: hash => `https://testnet.blockchain.info/tx/${hash}`,
  bitcoin: hash => `https://blockchain.info/tx/${hash}`,
  clubcoin: hash => `https://chainz.cryptoid.info/club/tx.dws?${hash}.htm`,
  dash: hash => `https://explorer.dash.org/tx/${hash}`,
  digibyte: hash => `https://digiexplorer.info/tx/${hash}`,
  dogecoin: hash => `https://dogechain.info/tx/${hash}`,
  ethereum_classic: hash => `https://gastracker.io/tx/${hash}`,
  ethereum_testnet: hash => `https://ropsten.etherscan.io/tx/${hash}`,
  ethereum: hash => `https://etherscan.io/tx/${hash}`,
  expanse: hash => `https://gander.tech/tx/${hash}`,
  hcash: hash => `http://explorer.h.cash/tx/${hash}`,
  icon: () => null,
  komodo: hash => `https://kmdexplorer.io/tx/${hash}`,
  litecoin: hash => `https://live.blockcypher.com/ltc/tx/${hash}`,
  monero: hash => `https://moneroblocks.info/tx/${hash}`,
  nano: hash => `https://nanoexplorer.io/blocks/${hash}`,
  neo: hash => `https://neotracker.io/tx/${hash}`,
  nimiq: hash => `https://nimiq.watch/#${hash}`,
  ontology: hash => `https://explorer.ont.io/transaction/${hash}`,
  particl: hash => `https://explorer.particl.io/tx/${hash}`,
  peercoin: hash => `https://explorer.peercoin.net/tx/${hash}`,
  pirl: hash => `https://poseidon.pirl.io/explorer/transaction/${hash}`,
  pivx: hash => `https://chainz.cryptoid.info/pivx/tx.dws?${hash}.htm`,
  poa: hash => `https://poaexplorer.com/tx/${hash}`,
  poswallet: () => null, // FIXME can't find a reliable/official explorer
  qtum: hash => `https://explorer.qtum.org/tx/${hash}`,
  ripple: hash => `https://bithomp.com/explorer/${hash}`,
  stealthcoin: hash => `https://chain.stealth.org/tx/${hash}`,
  stellar: hash => `https://stellar.expert/explorer/public/tx/${hash}`,
  stratis: hash => `https://chainz.cryptoid.info/strat/tx.dws?${hash}.htm`,
  tezos: hash => `https://tzscan.io/${hash}`,
  tron: hash => `https://tronscan.org/#/transaction/${hash}`,
  ubiq: hash => `https://ubiqscan.io/tx/${hash}`,
  vechain: hash => `https://explore.veforge.com/transactions/${hash}`,
  vertcoin: hash => `https://www.coinexplorer.net/VTC/transaction/${hash}`,
  viacoin: hash => `https://explorer.viacoin.org/tx/${hash}`,
  wanchain: hash => `https://explorer.wanchain.org/block/trans/${hash}`,
  zcash: hash => `https://explorer.zcha.in/transactions/${hash}`,
  zcoin: hash => `https://explorer.zcoin.io/tx/${hash}`,
  zencash: hash => `https://explorer.zensystem.io/tx/${hash}`
};

export const getAccountOperationExplorer = (
  account: Account,
  operation: Operation
): ?string => defaultExplorers[account.currency.id](operation.hash);
