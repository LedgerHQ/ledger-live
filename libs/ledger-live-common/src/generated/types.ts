import type {
  Transaction as algorandTransaction,
  TransactionRaw as algorandTransactionRaw,
  TransactionStatus as algorandTransactionStatus,
  TransactionStatusRaw as algorandTransactionStatusRaw,
} from "@ledgerhq/coin-algorand/types";
import type {
  Transaction as bitcoinTransaction,
  TransactionRaw as bitcoinTransactionRaw,
  TransactionStatus as bitcoinTransactionStatus,
  TransactionStatusRaw as bitcoinTransactionStatusRaw,
} from "@ledgerhq/coin-bitcoin/types";
import type {
  Transaction as cardanoTransaction,
  TransactionRaw as cardanoTransactionRaw,
  TransactionStatus as cardanoTransactionStatus,
  TransactionStatusRaw as cardanoTransactionStatusRaw,
} from "@ledgerhq/coin-cardano/types";
import type {
  Transaction as casperTransaction,
  TransactionRaw as casperTransactionRaw,
  TransactionStatus as casperTransactionStatus,
  TransactionStatusRaw as casperTransactionStatusRaw,
} from "../families/casper/types";
import type {
  Transaction as celoTransaction,
  TransactionRaw as celoTransactionRaw,
  TransactionStatus as celoTransactionStatus,
  TransactionStatusRaw as celoTransactionStatusRaw,
} from "../families/celo/types";
import type {
  Transaction as cosmosTransaction,
  TransactionRaw as cosmosTransactionRaw,
  TransactionStatus as cosmosTransactionStatus,
  TransactionStatusRaw as cosmosTransactionStatusRaw,
} from "../families/cosmos/types";
import type {
  Transaction as crypto_orgTransaction,
  TransactionRaw as crypto_orgTransactionRaw,
  TransactionStatus as crypto_orgTransactionStatus,
  TransactionStatusRaw as crypto_orgTransactionStatusRaw,
} from "../families/crypto_org/types";
import type {
  Transaction as elrondTransaction,
  TransactionRaw as elrondTransactionRaw,
  TransactionStatus as elrondTransactionStatus,
  TransactionStatusRaw as elrondTransactionStatusRaw,
} from "../families/elrond/types";
import type {
  Transaction as evmTransaction,
  TransactionRaw as evmTransactionRaw,
  TransactionStatus as evmTransactionStatus,
  TransactionStatusRaw as evmTransactionStatusRaw,
} from "@ledgerhq/coin-evm/types/index";
import type {
  Transaction as filecoinTransaction,
  TransactionRaw as filecoinTransactionRaw,
  TransactionStatus as filecoinTransactionStatus,
  TransactionStatusRaw as filecoinTransactionStatusRaw,
} from "../families/filecoin/types";
import type {
  Transaction as hederaTransaction,
  TransactionRaw as hederaTransactionRaw,
  TransactionStatus as hederaTransactionStatus,
  TransactionStatusRaw as hederaTransactionStatusRaw,
} from "../families/hedera/types";
import type {
  Transaction as internet_computerTransaction,
  TransactionRaw as internet_computerTransactionRaw,
  TransactionStatus as internet_computerTransactionStatus,
  TransactionStatusRaw as internet_computerTransactionStatusRaw,
} from "../families/internet_computer/types";
import type {
  Transaction as kadenaTransaction,
  TransactionRaw as kadenaTransactionRaw,
  TransactionStatus as kadenaTransactionStatus,
  TransactionStatusRaw as kadenaTransactionStatusRaw,
} from "@ledgerhq/coin-kadena/types";
import type {
  Transaction as nearTransaction,
  TransactionRaw as nearTransactionRaw,
  TransactionStatus as nearTransactionStatus,
  TransactionStatusRaw as nearTransactionStatusRaw,
} from "@ledgerhq/coin-near/types";
import type {
  Transaction as polkadotTransaction,
  TransactionRaw as polkadotTransactionRaw,
  TransactionStatus as polkadotTransactionStatus,
  TransactionStatusRaw as polkadotTransactionStatusRaw,
} from "@ledgerhq/coin-polkadot/types/index";
import type {
  Transaction as solanaTransaction,
  TransactionRaw as solanaTransactionRaw,
  TransactionStatus as solanaTransactionStatus,
  TransactionStatusRaw as solanaTransactionStatusRaw,
} from "@ledgerhq/coin-solana/types";
import type {
  Transaction as stacksTransaction,
  TransactionRaw as stacksTransactionRaw,
  TransactionStatus as stacksTransactionStatus,
  TransactionStatusRaw as stacksTransactionStatusRaw,
} from "../families/stacks/types";
import type {
  Transaction as stellarTransaction,
  TransactionRaw as stellarTransactionRaw,
  TransactionStatus as stellarTransactionStatus,
  TransactionStatusRaw as stellarTransactionStatusRaw,
} from "@ledgerhq/coin-stellar/types/index";
import type {
  Transaction as tezosTransaction,
  TransactionRaw as tezosTransactionRaw,
  TransactionStatus as tezosTransactionStatus,
  TransactionStatusRaw as tezosTransactionStatusRaw,
} from "@ledgerhq/coin-tezos/types/index";
import type {
  Transaction as tronTransaction,
  TransactionRaw as tronTransactionRaw,
  TransactionStatus as tronTransactionStatus,
  TransactionStatusRaw as tronTransactionStatusRaw,
} from "@ledgerhq/coin-tron/types/index";
import type {
  Transaction as vechainTransaction,
  TransactionRaw as vechainTransactionRaw,
  TransactionStatus as vechainTransactionStatus,
  TransactionStatusRaw as vechainTransactionStatusRaw,
} from "../families/vechain/types";
import type {
  Transaction as xrpTransaction,
  TransactionRaw as xrpTransactionRaw,
  TransactionStatus as xrpTransactionStatus,
  TransactionStatusRaw as xrpTransactionStatusRaw,
} from "@ledgerhq/coin-xrp/types/index";

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
  | kadenaTransaction
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
  | kadenaTransactionRaw
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
  | kadenaTransactionStatus
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
  | kadenaTransactionStatusRaw
  | nearTransactionStatusRaw
  | polkadotTransactionStatusRaw
  | solanaTransactionStatusRaw
  | stacksTransactionStatusRaw
  | stellarTransactionStatusRaw
  | tezosTransactionStatusRaw
  | tronTransactionStatusRaw
  | vechainTransactionStatusRaw
  | xrpTransactionStatusRaw;
