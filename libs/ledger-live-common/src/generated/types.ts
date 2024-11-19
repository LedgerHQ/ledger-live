<<<<<<< HEAD
import { Transaction as algorandTransaction } from "@ledgerhq/coin-algorand/types";
import { TransactionRaw as algorandTransactionRaw } from "@ledgerhq/coin-algorand/types";
import { TransactionStatus as algorandTransactionStatus } from "@ledgerhq/coin-algorand/types";
import { TransactionStatusRaw as algorandTransactionStatusRaw } from "@ledgerhq/coin-algorand/types";
import { Transaction as aptosTransaction } from "../families/aptos/types";
import { TransactionRaw as aptosTransactionRaw } from "../families/aptos/types";
import { TransactionStatus as aptosTransactionStatus } from "../families/aptos/types";
import { TransactionStatusRaw as aptosTransactionStatusRaw } from "../families/aptos/types";
import { Transaction as bitcoinTransaction } from "../families/bitcoin/types";
import { TransactionRaw as bitcoinTransactionRaw } from "../families/bitcoin/types";
import { TransactionStatus as bitcoinTransactionStatus } from "../families/bitcoin/types";
import { TransactionStatusRaw as bitcoinTransactionStatusRaw } from "../families/bitcoin/types";
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
import { Transaction as nearTransaction } from "../families/near/types";
import { TransactionRaw as nearTransactionRaw } from "../families/near/types";
import { TransactionStatus as nearTransactionStatus } from "../families/near/types";
import { TransactionStatusRaw as nearTransactionStatusRaw } from "../families/near/types";
import { Transaction as polkadotTransaction } from "@ledgerhq/coin-polkadot/types";
import { TransactionRaw as polkadotTransactionRaw } from "@ledgerhq/coin-polkadot/types";
import { TransactionStatus as polkadotTransactionStatus } from "@ledgerhq/coin-polkadot/types";
import { TransactionStatusRaw as polkadotTransactionStatusRaw } from "@ledgerhq/coin-polkadot/types";
import { Transaction as rippleTransaction } from "../families/ripple/types";
import { TransactionRaw as rippleTransactionRaw } from "../families/ripple/types";
import { TransactionStatus as rippleTransactionStatus } from "../families/ripple/types";
import { TransactionStatusRaw as rippleTransactionStatusRaw } from "../families/ripple/types";
import { Transaction as solanaTransaction } from "../families/solana/types";
import { TransactionRaw as solanaTransactionRaw } from "../families/solana/types";
import { TransactionStatus as solanaTransactionStatus } from "../families/solana/types";
import { TransactionStatusRaw as solanaTransactionStatusRaw } from "../families/solana/types";
import { Transaction as stacksTransaction } from "../families/stacks/types";
import { TransactionRaw as stacksTransactionRaw } from "../families/stacks/types";
import { TransactionStatus as stacksTransactionStatus } from "../families/stacks/types";
import { TransactionStatusRaw as stacksTransactionStatusRaw } from "../families/stacks/types";
import { Transaction as stellarTransaction } from "../families/stellar/types";
import { TransactionRaw as stellarTransactionRaw } from "../families/stellar/types";
import { TransactionStatus as stellarTransactionStatus } from "../families/stellar/types";
import { TransactionStatusRaw as stellarTransactionStatusRaw } from "../families/stellar/types";
import { Transaction as tezosTransaction } from "../families/tezos/types";
import { TransactionRaw as tezosTransactionRaw } from "../families/tezos/types";
import { TransactionStatus as tezosTransactionStatus } from "../families/tezos/types";
import { TransactionStatusRaw as tezosTransactionStatusRaw } from "../families/tezos/types";
import { Transaction as tronTransaction } from "../families/tron/types";
import { TransactionRaw as tronTransactionRaw } from "../families/tron/types";
import { TransactionStatus as tronTransactionStatus } from "../families/tron/types";
import { TransactionStatusRaw as tronTransactionStatusRaw } from "../families/tron/types";
import { Transaction as vechainTransaction } from "../families/vechain/types";
import { TransactionRaw as vechainTransactionRaw } from "../families/vechain/types";
import { TransactionStatus as vechainTransactionStatus } from "../families/vechain/types";
import { TransactionStatusRaw as vechainTransactionStatusRaw } from "../families/vechain/types";
=======
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
} from "@ledgerhq/coin-cosmos/types/index";
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
} from "@ledgerhq/coin-elrond/types";
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
} from "../families/internet_computer/types";
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
} from "../families/vechain/types";
import type {
  Transaction as xrpTransaction,
  TransactionRaw as xrpTransactionRaw,
  TransactionStatus as xrpTransactionStatus,
  TransactionStatusRaw as xrpTransactionStatusRaw,
} from "@ledgerhq/coin-xrp/types/index";
>>>>>>> develop

export type Transaction =
  | algorandTransaction
  | aptosTransaction
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
  | iconTransaction
  | internet_computerTransaction
  | nearTransaction
  | polkadotTransaction
  | solanaTransaction
  | stacksTransaction
  | stellarTransaction
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
  | crypto_orgTransactionRaw
  | elrondTransactionRaw
  | evmTransactionRaw
  | filecoinTransactionRaw
  | hederaTransactionRaw
  | iconTransactionRaw
  | internet_computerTransactionRaw
  | nearTransactionRaw
  | polkadotTransactionRaw
  | solanaTransactionRaw
  | stacksTransactionRaw
  | stellarTransactionRaw
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
  | crypto_orgTransactionStatus
  | elrondTransactionStatus
  | evmTransactionStatus
  | filecoinTransactionStatus
  | hederaTransactionStatus
  | iconTransactionStatus
  | internet_computerTransactionStatus
  | nearTransactionStatus
  | polkadotTransactionStatus
  | solanaTransactionStatus
  | stacksTransactionStatus
  | stellarTransactionStatus
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
  | crypto_orgTransactionStatusRaw
  | elrondTransactionStatusRaw
  | evmTransactionStatusRaw
  | filecoinTransactionStatusRaw
  | hederaTransactionStatusRaw
  | iconTransactionStatusRaw
  | internet_computerTransactionStatusRaw
  | nearTransactionStatusRaw
  | polkadotTransactionStatusRaw
  | solanaTransactionStatusRaw
  | stacksTransactionStatusRaw
  | stellarTransactionStatusRaw
  | tezosTransactionStatusRaw
  | tonTransactionStatusRaw
  | tronTransactionStatusRaw
  | vechainTransactionStatusRaw
  | xrpTransactionStatusRaw;
