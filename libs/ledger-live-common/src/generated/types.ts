import { Transaction as algorandTransaction } from "../families/algorand/types";
import { TransactionRaw as algorandTransactionRaw } from "../families/algorand/types";
import { Transaction as bitcoinTransaction } from "../families/bitcoin/types";
import { TransactionRaw as bitcoinTransactionRaw } from "../families/bitcoin/types";
import { Transaction as cardanoTransaction } from "../families/cardano/types";
import { TransactionRaw as cardanoTransactionRaw } from "../families/cardano/types";
import { Transaction as celoTransaction } from "../families/celo/types";
import { TransactionRaw as celoTransactionRaw } from "../families/celo/types";
import { Transaction as cosmosTransaction } from "../families/cosmos/types";
import { TransactionRaw as cosmosTransactionRaw } from "../families/cosmos/types";
import { Transaction as crypto_orgTransaction } from "../families/crypto_org/types";
import { TransactionRaw as crypto_orgTransactionRaw } from "../families/crypto_org/types";
import { Transaction as elrondTransaction } from "../families/elrond/types";
import { TransactionRaw as elrondTransactionRaw } from "../families/elrond/types";
import { Transaction as ethereumTransaction } from "../families/ethereum/types";
import { TransactionRaw as ethereumTransactionRaw } from "../families/ethereum/types";
import { Transaction as filecoinTransaction } from "../families/filecoin/types";
import { TransactionRaw as filecoinTransactionRaw } from "../families/filecoin/types";
import { Transaction as hederaTransaction } from "../families/hedera/types";
import { TransactionRaw as hederaTransactionRaw } from "../families/hedera/types";
import { Transaction as neoTransaction } from "../families/neo/types";
import { TransactionRaw as neoTransactionRaw } from "../families/neo/types";
import { Transaction as polkadotTransaction } from "../families/polkadot/types";
import { TransactionRaw as polkadotTransactionRaw } from "../families/polkadot/types";
import { Transaction as rippleTransaction } from "../families/ripple/types";
import { TransactionRaw as rippleTransactionRaw } from "../families/ripple/types";
import { Transaction as solanaTransaction } from "../families/solana/types";
import { TransactionRaw as solanaTransactionRaw } from "../families/solana/types";
import { Transaction as stellarTransaction } from "../families/stellar/types";
import { TransactionRaw as stellarTransactionRaw } from "../families/stellar/types";
import { Transaction as tezosTransaction } from "../families/tezos/types";
import { TransactionRaw as tezosTransactionRaw } from "../families/tezos/types";
import { Transaction as tronTransaction } from "../families/tron/types";
import { TransactionRaw as tronTransactionRaw } from "../families/tron/types";

export type Transaction =
  | algorandTransaction
  | bitcoinTransaction
  | cardanoTransaction
  | celoTransaction
  | cosmosTransaction
  | crypto_orgTransaction
  | elrondTransaction
  | ethereumTransaction
  | filecoinTransaction
  | hederaTransaction
  | neoTransaction
  | polkadotTransaction
  | rippleTransaction
  | solanaTransaction
  | stellarTransaction
  | tezosTransaction
  | tronTransaction
export type TransactionRaw =
  | algorandTransactionRaw
  | bitcoinTransactionRaw
  | cardanoTransactionRaw
  | celoTransactionRaw
  | cosmosTransactionRaw
  | crypto_orgTransactionRaw
  | elrondTransactionRaw
  | ethereumTransactionRaw
  | filecoinTransactionRaw
  | hederaTransactionRaw
  | neoTransactionRaw
  | polkadotTransactionRaw
  | rippleTransactionRaw
  | solanaTransactionRaw
  | stellarTransactionRaw
  | tezosTransactionRaw
  | tronTransactionRaw
