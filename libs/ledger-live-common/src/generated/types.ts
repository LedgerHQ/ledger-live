import type {
  Transaction as algorandTransaction,
  TransactionRaw as algorandTransactionRaw,
  TransactionStatus as algorandTransactionStatus,
  TransactionStatusRaw as algorandTransactionStatusRaw,
} from "@ledgerhq/coin-algorand/types";
import type {
  Transaction as aptosTransaction,
  TransactionRaw as aptosTransactionRaw,
  TransactionStatus as aptosTransactionStatus,
  TransactionStatusRaw as aptosTransactionStatusRaw,
} from "@ledgerhq/coin-aptos/types/index";
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
} from "@ledgerhq/coin-casper/types/index";
import type {
  Transaction as celoTransaction,
  TransactionRaw as celoTransactionRaw,
  TransactionStatus as celoTransactionStatus,
  TransactionStatusRaw as celoTransactionStatusRaw,
} from "../../../coin-modules/coin-celo/src/types";
import type {
  Transaction as cosmosTransaction,
  TransactionRaw as cosmosTransactionRaw,
  TransactionStatus as cosmosTransactionStatus,
  TransactionStatusRaw as cosmosTransactionStatusRaw,
} from "@ledgerhq/coin-cosmos/types/index";
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
} from "@ledgerhq/coin-filecoin/types/index";
import type {
  Transaction as hederaTransaction,
  TransactionRaw as hederaTransactionRaw,
  TransactionStatus as hederaTransactionStatus,
  TransactionStatusRaw as hederaTransactionStatusRaw,
} from "@ledgerhq/coin-hedera/types/index";
import type {
  Transaction as iconTransaction,
  TransactionRaw as iconTransactionRaw,
  TransactionStatus as iconTransactionStatus,
  TransactionStatusRaw as iconTransactionStatusRaw,
} from "@ledgerhq/coin-icon/types/index";
import type {
  Transaction as internet_computerTransaction,
  TransactionRaw as internet_computerTransactionRaw,
  TransactionStatus as internet_computerTransactionStatus,
  TransactionStatusRaw as internet_computerTransactionStatusRaw,
} from "@ledgerhq/coin-internet_computer/types/index";
import type {
  Transaction as multiversxTransaction,
  TransactionRaw as multiversxTransactionRaw,
  TransactionStatus as multiversxTransactionStatus,
  TransactionStatusRaw as multiversxTransactionStatusRaw,
} from "@ledgerhq/coin-multiversx/types";
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
} from "@ledgerhq/coin-stacks/types/index";
import type {
  Transaction as stellarTransaction,
  TransactionRaw as stellarTransactionRaw,
  TransactionStatus as stellarTransactionStatus,
  TransactionStatusRaw as stellarTransactionStatusRaw,
} from "@ledgerhq/coin-stellar/types/index";
import type {
  Transaction as suiTransaction,
  TransactionRaw as suiTransactionRaw,
  TransactionStatus as suiTransactionStatus,
  TransactionStatusRaw as suiTransactionStatusRaw,
} from "@ledgerhq/coin-sui/types/index";
import type {
  Transaction as tezosTransaction,
  TransactionRaw as tezosTransactionRaw,
  TransactionStatus as tezosTransactionStatus,
  TransactionStatusRaw as tezosTransactionStatusRaw,
} from "@ledgerhq/coin-tezos/types/index";
import type {
  Transaction as tonTransaction,
  TransactionRaw as tonTransactionRaw,
  TransactionStatus as tonTransactionStatus,
  TransactionStatusRaw as tonTransactionStatusRaw,
} from "@ledgerhq/coin-ton/types";
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
} from "@ledgerhq/coin-vechain/types/index";
import type {
  Transaction as xrpTransaction,
  TransactionRaw as xrpTransactionRaw,
  TransactionStatus as xrpTransactionStatus,
  TransactionStatusRaw as xrpTransactionStatusRaw,
} from "@ledgerhq/coin-xrp/types/index";

export type Transaction =
  | algorandTransaction
  | aptosTransaction
  | bitcoinTransaction
  | cardanoTransaction
  | casperTransaction
  | celoTransaction
  | cosmosTransaction
  | evmTransaction
  | filecoinTransaction
  | hederaTransaction
  | iconTransaction
  | internet_computerTransaction
  | multiversxTransaction
  | nearTransaction
  | polkadotTransaction
  | solanaTransaction
  | stacksTransaction
  | stellarTransaction
  | suiTransaction
  | tezosTransaction
  | tonTransaction
  | tronTransaction
  | vechainTransaction
  | xrpTransaction;

export type TransactionRaw =
  | algorandTransactionRaw
  | aptosTransactionRaw
  | bitcoinTransactionRaw
  | cardanoTransactionRaw
  | casperTransactionRaw
  | celoTransactionRaw
  | cosmosTransactionRaw
  | evmTransactionRaw
  | filecoinTransactionRaw
  | hederaTransactionRaw
  | iconTransactionRaw
  | internet_computerTransactionRaw
  | multiversxTransactionRaw
  | nearTransactionRaw
  | polkadotTransactionRaw
  | solanaTransactionRaw
  | stacksTransactionRaw
  | stellarTransactionRaw
  | suiTransactionRaw
  | tezosTransactionRaw
  | tonTransactionRaw
  | tronTransactionRaw
  | vechainTransactionRaw
  | xrpTransactionRaw;

export type TransactionStatus =
  | algorandTransactionStatus
  | aptosTransactionStatus
  | bitcoinTransactionStatus
  | cardanoTransactionStatus
  | casperTransactionStatus
  | celoTransactionStatus
  | cosmosTransactionStatus
  | evmTransactionStatus
  | filecoinTransactionStatus
  | hederaTransactionStatus
  | iconTransactionStatus
  | internet_computerTransactionStatus
  | multiversxTransactionStatus
  | nearTransactionStatus
  | polkadotTransactionStatus
  | solanaTransactionStatus
  | stacksTransactionStatus
  | stellarTransactionStatus
  | suiTransactionStatus
  | tezosTransactionStatus
  | tonTransactionStatus
  | tronTransactionStatus
  | vechainTransactionStatus
  | xrpTransactionStatus;

export type TransactionStatusRaw =
  | algorandTransactionStatusRaw
  | aptosTransactionStatusRaw
  | bitcoinTransactionStatusRaw
  | cardanoTransactionStatusRaw
  | casperTransactionStatusRaw
  | celoTransactionStatusRaw
  | cosmosTransactionStatusRaw
  | evmTransactionStatusRaw
  | filecoinTransactionStatusRaw
  | hederaTransactionStatusRaw
  | iconTransactionStatusRaw
  | internet_computerTransactionStatusRaw
  | multiversxTransactionStatusRaw
  | nearTransactionStatusRaw
  | polkadotTransactionStatusRaw
  | solanaTransactionStatusRaw
  | stacksTransactionStatusRaw
  | stellarTransactionStatusRaw
  | suiTransactionStatusRaw
  | tezosTransactionStatusRaw
  | tonTransactionStatusRaw
  | tronTransactionStatusRaw
  | vechainTransactionStatusRaw
  | xrpTransactionStatusRaw;
