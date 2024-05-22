import { Transaction as algorandTransaction } from "@ledgerhq/coin-algorand/types";
import { TransactionRaw as algorandTransactionRaw } from "@ledgerhq/coin-algorand/types";
import { TransactionStatus as algorandTransactionStatus } from "@ledgerhq/coin-algorand/types";
import { TransactionStatusRaw as algorandTransactionStatusRaw } from "@ledgerhq/coin-algorand/types";
import { Transaction as bitcoinTransaction } from "@ledgerhq/coin-bitcoin/types";
import { TransactionRaw as bitcoinTransactionRaw } from "@ledgerhq/coin-bitcoin/types";
import { TransactionStatus as bitcoinTransactionStatus } from "@ledgerhq/coin-bitcoin/types";
import { TransactionStatusRaw as bitcoinTransactionStatusRaw } from "@ledgerhq/coin-bitcoin/types";
import { Transaction as cardanoTransaction } from "../families/cardano/types";
import { TransactionRaw as cardanoTransactionRaw } from "../families/cardano/types";
import { TransactionStatus as cardanoTransactionStatus } from "../families/cardano/types";
import { TransactionStatusRaw as cardanoTransactionStatusRaw } from "../families/cardano/types";
import { Transaction as casperTransaction } from "../families/casper/types";
import { TransactionRaw as casperTransactionRaw } from "../families/casper/types";
import { TransactionStatus as casperTransactionStatus } from "../families/casper/types";
import { TransactionStatusRaw as casperTransactionStatusRaw } from "../families/casper/types";
import { Transaction as celoTransaction } from "../families/celo/types";
import { TransactionRaw as celoTransactionRaw } from "../families/celo/types";
import { TransactionStatus as celoTransactionStatus } from "../families/celo/types";
import { TransactionStatusRaw as celoTransactionStatusRaw } from "../families/celo/types";
import { Transaction as cosmosTransaction } from "../families/cosmos/types";
import { TransactionRaw as cosmosTransactionRaw } from "../families/cosmos/types";
import { TransactionStatus as cosmosTransactionStatus } from "../families/cosmos/types";
import { TransactionStatusRaw as cosmosTransactionStatusRaw } from "../families/cosmos/types";
import { Transaction as crypto_orgTransaction } from "../families/crypto_org/types";
import { TransactionRaw as crypto_orgTransactionRaw } from "../families/crypto_org/types";
import { TransactionStatus as crypto_orgTransactionStatus } from "../families/crypto_org/types";
import { TransactionStatusRaw as crypto_orgTransactionStatusRaw } from "../families/crypto_org/types";
import { Transaction as elrondTransaction } from "../families/elrond/types";
import { TransactionRaw as elrondTransactionRaw } from "../families/elrond/types";
import { TransactionStatus as elrondTransactionStatus } from "../families/elrond/types";
import { TransactionStatusRaw as elrondTransactionStatusRaw } from "../families/elrond/types";
import { Transaction as evmTransaction } from "@ledgerhq/coin-evm/types/index";
import { TransactionRaw as evmTransactionRaw } from "@ledgerhq/coin-evm/types/index";
import { TransactionStatus as evmTransactionStatus } from "@ledgerhq/coin-evm/types/index";
import { TransactionStatusRaw as evmTransactionStatusRaw } from "@ledgerhq/coin-evm/types/index";
import { Transaction as filecoinTransaction } from "../families/filecoin/types";
import { TransactionRaw as filecoinTransactionRaw } from "../families/filecoin/types";
import { TransactionStatus as filecoinTransactionStatus } from "../families/filecoin/types";
import { TransactionStatusRaw as filecoinTransactionStatusRaw } from "../families/filecoin/types";
import { Transaction as hederaTransaction } from "../families/hedera/types";
import { TransactionRaw as hederaTransactionRaw } from "../families/hedera/types";
import { TransactionStatus as hederaTransactionStatus } from "../families/hedera/types";
import { TransactionStatusRaw as hederaTransactionStatusRaw } from "../families/hedera/types";
import { Transaction as internet_computerTransaction } from "../families/internet_computer/types";
import { TransactionRaw as internet_computerTransactionRaw } from "../families/internet_computer/types";
import { TransactionStatus as internet_computerTransactionStatus } from "../families/internet_computer/types";
import { TransactionStatusRaw as internet_computerTransactionStatusRaw } from "../families/internet_computer/types";
import { Transaction as nearTransaction } from "@ledgerhq/coin-near/types";
import { TransactionRaw as nearTransactionRaw } from "@ledgerhq/coin-near/types";
import { TransactionStatus as nearTransactionStatus } from "@ledgerhq/coin-near/types";
import { TransactionStatusRaw as nearTransactionStatusRaw } from "@ledgerhq/coin-near/types";
import { Transaction as polkadotTransaction } from "@ledgerhq/coin-polkadot/types/index";
import { TransactionRaw as polkadotTransactionRaw } from "@ledgerhq/coin-polkadot/types/index";
import { TransactionStatus as polkadotTransactionStatus } from "@ledgerhq/coin-polkadot/types/index";
import { TransactionStatusRaw as polkadotTransactionStatusRaw } from "@ledgerhq/coin-polkadot/types/index";
import { Transaction as solanaTransaction } from "@ledgerhq/coin-solana/types";
import { TransactionRaw as solanaTransactionRaw } from "@ledgerhq/coin-solana/types";
import { TransactionStatus as solanaTransactionStatus } from "@ledgerhq/coin-solana/types";
import { TransactionStatusRaw as solanaTransactionStatusRaw } from "@ledgerhq/coin-solana/types";
import { Transaction as stacksTransaction } from "../families/stacks/types";
import { TransactionRaw as stacksTransactionRaw } from "../families/stacks/types";
import { TransactionStatus as stacksTransactionStatus } from "../families/stacks/types";
import { TransactionStatusRaw as stacksTransactionStatusRaw } from "../families/stacks/types";
import { Transaction as stellarTransaction } from "../families/stellar/types";
import { TransactionRaw as stellarTransactionRaw } from "../families/stellar/types";
import { TransactionStatus as stellarTransactionStatus } from "../families/stellar/types";
import { TransactionStatusRaw as stellarTransactionStatusRaw } from "../families/stellar/types";
import { Transaction as tezosTransaction } from "@ledgerhq/coin-tezos/types/index";
import { TransactionRaw as tezosTransactionRaw } from "@ledgerhq/coin-tezos/types/index";
import { TransactionStatus as tezosTransactionStatus } from "@ledgerhq/coin-tezos/types/index";
import { TransactionStatusRaw as tezosTransactionStatusRaw } from "@ledgerhq/coin-tezos/types/index";
import { Transaction as tronTransaction } from "../families/tron/types";
import { TransactionRaw as tronTransactionRaw } from "../families/tron/types";
import { TransactionStatus as tronTransactionStatus } from "../families/tron/types";
import { TransactionStatusRaw as tronTransactionStatusRaw } from "../families/tron/types";
import { Transaction as vechainTransaction } from "../families/vechain/types";
import { TransactionRaw as vechainTransactionRaw } from "../families/vechain/types";
import { TransactionStatus as vechainTransactionStatus } from "../families/vechain/types";
import { TransactionStatusRaw as vechainTransactionStatusRaw } from "../families/vechain/types";
import { Transaction as xrpTransaction } from "@ledgerhq/coin-xrp/types";
import { TransactionRaw as xrpTransactionRaw } from "@ledgerhq/coin-xrp/types";
import { TransactionStatus as xrpTransactionStatus } from "@ledgerhq/coin-xrp/types";
import { TransactionStatusRaw as xrpTransactionStatusRaw } from "@ledgerhq/coin-xrp/types";

export type Transaction =
  | algorandTransaction
  | bitcoinTransaction
  | cardanoTransaction
  | casperTransaction
  | celoTransaction
  | cosmosTransaction
  | crypto_orgTransaction
  | elrondTransaction
  | evmTransaction
  | filecoinTransaction
  | hederaTransaction
  | internet_computerTransaction
  | nearTransaction
  | polkadotTransaction
  | solanaTransaction
  | stacksTransaction
  | stellarTransaction
  | tezosTransaction
  | tronTransaction
  | vechainTransaction
  | xrpTransaction;

export type TransactionRaw =
  | algorandTransactionRaw
  | bitcoinTransactionRaw
  | cardanoTransactionRaw
  | casperTransactionRaw
  | celoTransactionRaw
  | cosmosTransactionRaw
  | crypto_orgTransactionRaw
  | elrondTransactionRaw
  | evmTransactionRaw
  | filecoinTransactionRaw
  | hederaTransactionRaw
  | internet_computerTransactionRaw
  | nearTransactionRaw
  | polkadotTransactionRaw
  | solanaTransactionRaw
  | stacksTransactionRaw
  | stellarTransactionRaw
  | tezosTransactionRaw
  | tronTransactionRaw
  | vechainTransactionRaw
  | xrpTransactionRaw;

export type TransactionStatus =
  | algorandTransactionStatus
  | bitcoinTransactionStatus
  | cardanoTransactionStatus
  | casperTransactionStatus
  | celoTransactionStatus
  | cosmosTransactionStatus
  | crypto_orgTransactionStatus
  | elrondTransactionStatus
  | evmTransactionStatus
  | filecoinTransactionStatus
  | hederaTransactionStatus
  | internet_computerTransactionStatus
  | nearTransactionStatus
  | polkadotTransactionStatus
  | solanaTransactionStatus
  | stacksTransactionStatus
  | stellarTransactionStatus
  | tezosTransactionStatus
  | tronTransactionStatus
  | vechainTransactionStatus
  | xrpTransactionStatus;

export type TransactionStatusRaw =
  | algorandTransactionStatusRaw
  | bitcoinTransactionStatusRaw
  | cardanoTransactionStatusRaw
  | casperTransactionStatusRaw
  | celoTransactionStatusRaw
  | cosmosTransactionStatusRaw
  | crypto_orgTransactionStatusRaw
  | elrondTransactionStatusRaw
  | evmTransactionStatusRaw
  | filecoinTransactionStatusRaw
  | hederaTransactionStatusRaw
  | internet_computerTransactionStatusRaw
  | nearTransactionStatusRaw
  | polkadotTransactionStatusRaw
  | solanaTransactionStatusRaw
  | stacksTransactionStatusRaw
  | stellarTransactionStatusRaw
  | tezosTransactionStatusRaw
  | tronTransactionStatusRaw
  | vechainTransactionStatusRaw
  | xrpTransactionStatusRaw;
