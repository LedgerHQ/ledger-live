<<<<<<< HEAD
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
} from "../families/stellar/types";
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
} from "../families/tron/types";
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
} from "@ledgerhq/coin-xrp/types";
=======
import { Transaction as algorandTransaction } from "../families/algorand/types";
import { TransactionRaw as algorandTransactionRaw } from "../families/algorand/types";
import { TransactionStatus as algorandTransactionStatus } from "../families/algorand/types";
import { TransactionStatusRaw as algorandTransactionStatusRaw } from "../families/algorand/types";
import { Transaction as bitcoinTransaction } from "../families/bitcoin/types";
import { TransactionRaw as bitcoinTransactionRaw } from "../families/bitcoin/types";
import { TransactionStatus as bitcoinTransactionStatus } from "../families/bitcoin/types";
import { TransactionStatusRaw as bitcoinTransactionStatusRaw } from "../families/bitcoin/types";
import { Transaction as cardanoTransaction } from "../families/cardano/types";
import { TransactionRaw as cardanoTransactionRaw } from "../families/cardano/types";
import { TransactionStatus as cardanoTransactionStatus } from "../families/cardano/types";
import { TransactionStatusRaw as cardanoTransactionStatusRaw } from "../families/cardano/types";
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
import { Transaction as ethereumTransaction } from "../families/ethereum/types";
import { TransactionRaw as ethereumTransactionRaw } from "../families/ethereum/types";
import { TransactionStatus as ethereumTransactionStatus } from "../families/ethereum/types";
import { TransactionStatusRaw as ethereumTransactionStatusRaw } from "../families/ethereum/types";
import { Transaction as evmTransaction } from "../families/evm/types";
import { TransactionRaw as evmTransactionRaw } from "../families/evm/types";
import { TransactionStatus as evmTransactionStatus } from "../families/evm/types";
import { TransactionStatusRaw as evmTransactionStatusRaw } from "../families/evm/types";
import { Transaction as filecoinTransaction } from "../families/filecoin/types";
import { TransactionRaw as filecoinTransactionRaw } from "../families/filecoin/types";
import { TransactionStatus as filecoinTransactionStatus } from "../families/filecoin/types";
import { TransactionStatusRaw as filecoinTransactionStatusRaw } from "../families/filecoin/types";
import { Transaction as hederaTransaction } from "../families/hedera/types";
import { TransactionRaw as hederaTransactionRaw } from "../families/hedera/types";
import { TransactionStatus as hederaTransactionStatus } from "../families/hedera/types";
import { TransactionStatusRaw as hederaTransactionStatusRaw } from "../families/hedera/types";
>>>>>>> 414b5dbd18 (feat: add staking feature for icon network)
import { Transaction as iconTransaction } from "../families/icon/types";
import { TransactionRaw as iconTransactionRaw } from "../families/icon/types";
import { TransactionStatus as iconTransactionStatus } from "../families/icon/types";
import { TransactionStatusRaw as iconTransactionStatusRaw } from "../families/icon/types";
<<<<<<< HEAD
=======
import { Transaction as nearTransaction } from "../families/near/types";
import { TransactionRaw as nearTransactionRaw } from "../families/near/types";
import { TransactionStatus as nearTransactionStatus } from "../families/near/types";
import { TransactionStatusRaw as nearTransactionStatusRaw } from "../families/near/types";
import { Transaction as neoTransaction } from "../families/neo/types";
import { TransactionRaw as neoTransactionRaw } from "../families/neo/types";
import { TransactionStatus as neoTransactionStatus } from "../families/neo/types";
import { TransactionStatusRaw as neoTransactionStatusRaw } from "../families/neo/types";
import { Transaction as osmosisTransaction } from "../families/osmosis/types";
import { TransactionRaw as osmosisTransactionRaw } from "../families/osmosis/types";
import { TransactionStatus as osmosisTransactionStatus } from "../families/osmosis/types";
import { TransactionStatusRaw as osmosisTransactionStatusRaw } from "../families/osmosis/types";
import { Transaction as polkadotTransaction } from "../families/polkadot/types";
import { TransactionRaw as polkadotTransactionRaw } from "../families/polkadot/types";
import { TransactionStatus as polkadotTransactionStatus } from "../families/polkadot/types";
import { TransactionStatusRaw as polkadotTransactionStatusRaw } from "../families/polkadot/types";
import { Transaction as rippleTransaction } from "../families/ripple/types";
import { TransactionRaw as rippleTransactionRaw } from "../families/ripple/types";
import { TransactionStatus as rippleTransactionStatus } from "../families/ripple/types";
import { TransactionStatusRaw as rippleTransactionStatusRaw } from "../families/ripple/types";
import { Transaction as solanaTransaction } from "../families/solana/types";
import { TransactionRaw as solanaTransactionRaw } from "../families/solana/types";
import { TransactionStatus as solanaTransactionStatus } from "../families/solana/types";
import { TransactionStatusRaw as solanaTransactionStatusRaw } from "../families/solana/types";
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
>>>>>>> 414b5dbd18 (feat: add staking feature for icon network)

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
<<<<<<< HEAD
  | internet_computerTransaction
  | nearTransaction
  | iconTransaction
=======
  | iconTransaction
  | nearTransaction
  | neoTransaction
  | osmosisTransaction
>>>>>>> 414b5dbd18 (feat: add staking feature for icon network)
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
<<<<<<< HEAD
  | internet_computerTransactionRaw
  | nearTransactionRaw
  | iconTransactionRaw
=======
  | iconTransactionRaw
  | nearTransactionRaw
  | neoTransactionRaw
  | osmosisTransactionRaw
>>>>>>> 414b5dbd18 (feat: add staking feature for icon network)
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
<<<<<<< HEAD
  | internet_computerTransactionStatus
  | nearTransactionStatus
  | iconTransactionStatus
=======
  | iconTransactionStatus
  | nearTransactionStatus
  | neoTransactionStatus
  | osmosisTransactionStatus
>>>>>>> 414b5dbd18 (feat: add staking feature for icon network)
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
<<<<<<< HEAD
  | internet_computerTransactionStatusRaw
  | nearTransactionStatusRaw
  | iconTransactionStatusRaw
=======
  | iconTransactionStatusRaw
  | nearTransactionStatusRaw
  | neoTransactionStatusRaw
  | osmosisTransactionStatusRaw
>>>>>>> 414b5dbd18 (feat: add staking feature for icon network)
  | polkadotTransactionStatusRaw
  | solanaTransactionStatusRaw
  | stacksTransactionStatusRaw
  | stellarTransactionStatusRaw
  | tezosTransactionStatusRaw
  | tronTransactionStatusRaw
  | vechainTransactionStatusRaw
  | xrpTransactionStatusRaw;
