// @flow

import type { Account, Operation, CryptoCurrencyConfig } from "./types";

type Explorer = string => ?string;

export const defaultExplorers: CryptoCurrencyConfig<Explorer> = {
  bitcoin_cash: hash => `https://bitcoincash.blockexplorer.com/tx/${hash}`,
  bitcoin_gold: hash => `https://btgexplorer.com/tx/${hash}`,
  bitcoin_testnet: hash => `https://testnet.blockchain.info/tx/${hash}`,
  bitcoin: hash => `https://blockchain.info/tx/${hash}`,
  dash: hash => `https://explorer.dash.org/tx/${hash}`,
  digibyte: hash => `https://digiexplorer.info/tx/${hash}`,
  dogecoin: hash => `https://dogechain.info/tx/${hash}`,
  ethereum_classic: hash => `https://gastracker.io/tx/${hash}`,
  ethereum_testnet: hash => `https://ropsten.etherscan.io/tx/${hash}`,
  ethereum: hash => `https://etherscan.io/tx/${hash}`,
  hcash: hash => `http://explorer.h.cash/tx/${hash}`,
  komodo: hash => `https://kmdexplorer.io/tx/${hash}`,
  litecoin: hash => `http://explorer.litecoin.net/tx/${hash}`,
  peercoin: hash => `https://explorer.peercoin.net/tx/${hash}`,
  pivx: () => null, // FIXME can't find a reliable/official explorer
  poswallet: () => null, // FIXME can't find a reliable/official explorer
  qtum: hash => `https://explorer.qtum.org/tx/${hash}`,
  ripple: hash => `https://bithomp.com/explorer/${hash}`,
  stealthcoin: () => null, // FIXME can't find a reliable/official explorer
  stratis: () => null, // FIXME can't find a reliable/official explorer
  vertcoin: hash => `http://explorer.vertcoin.info/tx/${hash}`,
  viacoin: hash => `https://explorer.viacoin.org/tx/${hash}`,
  zcash: hash => `https://explorer.zcha.in/transactions/${hash}`,
  zencash: hash => `https://explorer.zensystem.io/tx/${hash}`,
  clubcoin: () => null
};

export const getAccountOperationExplorer = (
  account: Account,
  operation: Operation
): ?string => defaultExplorers[account.currency.id](operation.hash);
