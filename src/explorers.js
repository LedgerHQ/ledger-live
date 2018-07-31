// @flow

import type { Account, Operation, CryptoCurrencyConfig } from "./types";

type Explorer = string => ?string;

export const defaultExplorers: CryptoCurrencyConfig<Explorer> = {
  bitcoin: hash => `https://blockchain.info/tx/${hash}`,
  bitcoin_cash: hash => `https://bitcoincash.blockexplorer.com/tx/${hash}`,
  bitcoin_gold: hash => `https://btgexplorer.com/tx/${hash}`,
  bitcoin_testnet: hash => `https://testnet.blockchain.info/tx/${hash}`,
  clubcoin: hash => `https://chainz.cryptoid.info/club/tx.dws?${hash}.htm`,
  dash: hash => `https://explorer.dash.org/tx/${hash}`,
  digibyte: hash => `https://digiexplorer.info/tx/${hash}`,
  dogecoin: hash => `https://dogechain.info/tx/${hash}`,
  ethereum: hash => `https://etherscan.io/tx/${hash}`,
  ethereum_classic: hash => `https://gastracker.io/tx/${hash}`,
  ethereum_testnet: hash => `https://ropsten.etherscan.io/tx/${hash}`,
  hcash: hash => `http://explorer.h.cash/tx/${hash}`,
  komodo: hash => `https://kmdexplorer.io/tx/${hash}`,
  litecoin: hash => `https://live.blockcypher.com/ltc/tx/${hash}`,
  peercoin: hash => `https://explorer.peercoin.net/tx/${hash}`,
  pivx: hash => `https://chainz.cryptoid.info/pivx/tx.dws?${hash}.htm`,
  poswallet: () => null, // FIXME can't find a reliable/official explorer
  qtum: hash => `https://explorer.qtum.org/tx/${hash}`,
  ripple: hash => `https://bithomp.com/explorer/${hash}`,
  stealthcoin: hash => `https://chain.stealth.org/tx/${hash}`,
  stratis: hash => `https://chainz.cryptoid.info/strat/tx.dws?${hash}.htm`,
  ubiq: hash => `https://ubiqscan.io/tx/${hash}`,
  vertcoin: hash => `https://www.coinexplorer.net/VTC/transaction/${hash}`,
  viacoin: hash => `https://explorer.viacoin.org/tx/${hash}`,
  zcash: hash => `https://explorer.zcha.in/transactions/${hash}`,
  zencash: hash => `https://explorer.zensystem.io/tx/${hash}`
};

export const getAccountOperationExplorer = (
  account: Account,
  operation: Operation
): ?string => defaultExplorers[account.currency.id](operation.hash);
