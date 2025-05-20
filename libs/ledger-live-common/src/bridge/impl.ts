import {
  isAlgorandTransaction,
  isAlgorandTransactionRaw,
  type AlgorandBridge,
} from "@ledgerhq/coin-algorand/types";
import { AptosBridge, isAptosTransaction, isAptosTransactionRaw } from "@ledgerhq/coin-aptos/index";
import { BitcoinBridge } from "@ledgerhq/coin-bitcoin/bridge/js";
import { isBitcoinTransaction, isBitcoinTransactionRaw } from "@ledgerhq/coin-bitcoin/lib/types";
import {
  CardanoBridge,
  isCardanoTransaction,
  isCardanoTransactionRaw,
} from "@ledgerhq/coin-cardano/types";
import { CeloBridge } from "@ledgerhq/coin-celo/bridge/index";
import type { EvmBridge } from "@ledgerhq/coin-evm/bridge/js";
import { isEvmTransaction, isEvmTransactionRaw } from "@ledgerhq/coin-evm/lib/types/transaction";
import { FilecoinBridge } from "@ledgerhq/coin-filecoin/index";
import {
  isInternetComputerTransaction,
  isInternetComputerTransactionRaw,
  type InternetComputerBridge,
} from "@ledgerhq/coin-internet_computer/types";
import { MinaBridge } from "@ledgerhq/coin-mina/bridge/index";
import type { MultiversXBridge } from "@ledgerhq/coin-multiversx/bridge/js";
import {
  isMultiversXTransaction,
  isMultiversXTransactionRaw,
} from "@ledgerhq/coin-multiversx/lib/types";
import { NearBridge } from "@ledgerhq/coin-near/bridge/js";
import { isNearTransaction, isNearTransactionRaw } from "@ledgerhq/coin-near/lib/types";
import {
  isPolkadotTransaction,
  isPolkadotTransactionRaw,
  PolkadotBridge,
} from "@ledgerhq/coin-polkadot/index";
import { SolanaBridge } from "@ledgerhq/coin-solana/bridge/bridge";
import { isSolanaTransaction, isSolanaTransactionRaw } from "@ledgerhq/coin-solana/lib/types";
import {
  isStacksTransaction,
  isStacksTransactionRaw,
  StacksBridge,
} from "@ledgerhq/coin-stacks/index";
import { StellarBridge } from "@ledgerhq/coin-stellar/bridge/index";
import { isSuiTransaction, isSuiTransactionRaw, SuiBridge } from "@ledgerhq/coin-sui";
import { TezosBridge } from "@ledgerhq/coin-tezos/bridge/index";
import { TonBridge } from "@ledgerhq/coin-ton/bridge/js";
import { isTonTransaction, isTonTransactionRaw } from "@ledgerhq/coin-ton/lib/types";
import { isTronTransaction, isTronTransactionRaw, TronBridge } from "@ledgerhq/coin-tron/index";
import { VechainBridge } from "@ledgerhq/coin-vechain/index";
import { isXrpTransaction, isXrpTransactionRaw, XrpBridge } from "@ledgerhq/coin-xrp/index";
import { CurrencyNotSupported } from "@ledgerhq/errors";
import { getEnv } from "@ledgerhq/live-env";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  Account,
  AccountBridge,
  AccountLike,
  CurrencyBridge,
  TransactionCommon,
  TransactionCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { decodeAccountId, getMainAccount } from "../account";
import { checkAccountSupported } from "../account/index";
import {
  CasperBridge,
  isCasperTransaction,
  isCasperTransactionRaw,
} from "../families/casper/types";
import { isCeloTransaction, isCeloTransactionRaw } from "../families/celo/types";
import {
  CosmosBridge,
  isCosmosTransaction,
  isCosmosTransactionRaw,
} from "../families/cosmos/types";
import { isFilecoinTransaction, isFilecoinTransactionRaw } from "../families/filecoin/types";
import {
  HederaBridge,
  isHederaTransaction,
  isHederaTransactionRaw,
} from "../families/hedera/types";
import { IconBridge, isIconTransaction, isIconTransactionRaw } from "../families/icon/types";
import { isMinaTransaction, isMinaTransactionRaw } from "../families/mina/types";
import { isStellarTransaction, isStellarTransactionRaw } from "../families/stellar/types";
import { isTezosTransaction, isTezosTransactionRaw } from "../families/tezos/types";
import { isVechainTransaction, isVechainTransactionRaw } from "../families/vechain/types";
import jsBridges from "../generated/bridge/js";
import mockBridges from "../generated/bridge/mock";
import { Transaction, TransactionRaw } from "../generated/types";

export const getCurrencyBridge = (currency: CryptoCurrency): CurrencyBridge => {
  if (getEnv("MOCK")) {
    const mockBridge = mockBridges[currency.family];
    if (mockBridge) return mockBridge.currencyBridge;
    throw new CurrencyNotSupported("no mock implementation available for currency " + currency.id, {
      currencyName: currency.id,
    });
  }

  const jsBridge = jsBridges[currency.family];
  if (jsBridge) {
    return jsBridge.currencyBridge;
  }

  throw new CurrencyNotSupported("no implementation available for currency " + currency.id, {
    currencyName: currency.id,
  });
};

export const getAccountBridge = (
  account: AccountLike,
  parentAccount?: Account | null,
): AccountBridge<any> => {
  const mainAccount = getMainAccount(account, parentAccount);
  const { currency } = mainAccount;
  const supportedError = checkAccountSupported(mainAccount);

  if (supportedError) {
    throw supportedError;
  }

  try {
    return getAccountBridgeByFamily(currency.family, mainAccount.id);
  } catch {
    throw new CurrencyNotSupported("currency not supported " + currency.id, {
      currencyName: currency.id,
    });
  }
};

export function getAccountBridgeByFamily(family: string, accountId?: string): AccountBridge<any> {
  if (accountId) {
    const { type } = decodeAccountId(accountId);

    if (type === "mock") {
      const mockBridge = mockBridges[family];
      if (mockBridge) return mockBridge.accountBridge;
    }
  }

  const jsBridge = jsBridges[family];
  if (!jsBridge) {
    throw new CurrencyNotSupported("account bridge not found " + family);
  }
  return jsBridge.accountBridge;
}

type CoinBridge =
  | AlgorandBridge
  | AptosBridge
  | BitcoinBridge
  | CardanoBridge
  | CasperBridge
  | CeloBridge
  | CosmosBridge
  | EvmBridge
  | FilecoinBridge
  | HederaBridge
  | IconBridge
  | InternetComputerBridge
  | MinaBridge
  | MultiversXBridge
  | NearBridge
  | PolkadotBridge
  | SolanaBridge
  | StacksBridge
  | StellarBridge
  | SuiBridge
  | TezosBridge
  | TonBridge
  | TronBridge
  | VechainBridge
  | XrpBridge;

export function getBridgeByFamily(family: string, accountId?: string): CoinBridge {
  if (accountId) {
    const { type } = decodeAccountId(accountId);

    if (type === "mock") {
      const mockBridge = mockBridges[family];
      if (mockBridge) return mockBridge.accountBridge;
    }
  }

  switch (family) {
    case "algorand":
      return jsBridges.algorand;
    case "aptos":
      return jsBridges.aptos;
    case "bitcoin":
      return jsBridges.bitcoin;
    case "cardano":
      return jsBridges.cardano;
    case "casper":
      return jsBridges.casper;
    case "celo":
      return jsBridges.celo;
    case "cosmos":
      return jsBridges.cosmos;
    case "evm":
      return jsBridges.evm;
    case "hedera":
      return jsBridges.hedera;
    case "filecoin":
      return jsBridges.filecoin;
    case "internet_computer":
      return jsBridges.internet_computer;
    case "icon":
      return jsBridges.icon;
    case "mina":
      return jsBridges.mina;
    case "multiversx":
      return jsBridges.multiversx;
    case "near":
      return jsBridges.near;
    case "polkadot":
      return jsBridges.polkadot;
    case "solana":
      return jsBridges.solana;
    case "stacks":
      return jsBridges.stacks;
    case "stellar":
      return jsBridges.stellar;
    case "sui":
      return jsBridges.sui;
    case "tezos":
      return jsBridges.tezos;
    case "ton":
      return jsBridges.ton;
    case "tron":
      return jsBridges.tron;
    case "vechain":
      return jsBridges.vechain;
    case "xrp":
      return jsBridges.xrp;
    default:
      throw new CurrencyNotSupported("bridge not found " + family);
  }
}

export function getBridgeByTransaction(tx: Transaction | TransactionRaw): CoinBridge {
  return getBridgeByFamily(tx.family);
}

function isTransaction(tx: TransactionCommon | TransactionCommonRaw): tx is TransactionCommon {
  return BigNumber.isBigNumber(tx.amount);
}
export function callSerializeBridgeFunc(
  tx: TransactionCommon | TransactionCommonRaw,
  func: string,
) {
  return isTransaction(tx)
    ? callSerializeBridgeFuncOnTransaction(tx, func)
    : callSerializeBridgeFuncOnTransactionRaw(tx, func);
}

function callSerializeBridgeFuncOnTransaction(tx: TransactionCommon, func: string) {
  if (isAlgorandTransaction(tx)) {
    return jsBridges.algorand.serializationBridge[func](tx);
  }
  if (isAptosTransaction(tx)) {
    return jsBridges.aptos.serializationBridge[func](tx);
  }
  if (isBitcoinTransaction(tx)) {
    return jsBridges.bitcoin.serializationBridge[func](tx);
  }
  if (isCardanoTransaction(tx)) {
    return jsBridges.cardano.serializationBridge[func](tx);
  }
  if (isCasperTransaction(tx)) {
    return jsBridges.casper.serializationBridge[func](tx);
  }
  if (isCeloTransaction(tx)) {
    return jsBridges.celo.serializationBridge[func](tx);
  }
  if (isCosmosTransaction(tx)) {
    return jsBridges.cosmos.serializationBridge[func](tx);
  }
  if (isEvmTransaction(tx)) {
    return jsBridges.evm.serializationBridge[func](tx);
  }
  if (isHederaTransaction(tx)) {
    return jsBridges.hedera.serializationBridge[func](tx);
  }
  if (isFilecoinTransaction(tx)) {
    return jsBridges.filecoin.serializationBridge[func](tx);
  }
  if (isInternetComputerTransaction(tx)) {
    return jsBridges.internet_computer.serializationBridge[func](tx);
  }
  if (isIconTransaction(tx)) {
    return jsBridges.icon.serializationBridge[func](tx);
  }
  if (isMinaTransaction(tx)) {
    return jsBridges.mina.serializationBridge[func](tx);
  }
  if (isMultiversXTransaction(tx)) {
    return jsBridges.multiversx.serializationBridge[func](tx);
  }
  if (isNearTransaction(tx)) {
    return jsBridges.near.serializationBridge[func](tx);
  }
  if (isPolkadotTransaction(tx)) {
    return jsBridges.polkadot.serializationBridge[func](tx);
  }
  if (isSolanaTransaction(tx)) {
    return jsBridges.solana.serializationBridge[func](tx);
  }
  if (isStacksTransaction(tx)) {
    return jsBridges.stacks.serializationBridge[func](tx);
  }
  if (isStellarTransaction(tx)) {
    return jsBridges.stellar.serializationBridge[func](tx);
  }
  if (isSuiTransaction(tx)) {
    return jsBridges.sui.serializationBridge[func](tx);
  }
  if (isTezosTransaction(tx)) {
    return jsBridges.tezos.serializationBridge[func](tx);
  }
  if (isTonTransaction(tx)) {
    return jsBridges.ton.serializationBridge[func](tx);
  }
  if (isTronTransaction(tx)) {
    return jsBridges.tron.serializationBridge[func](tx);
  }
  if (isVechainTransaction(tx)) {
    return jsBridges.vechain.serializationBridge[func](tx);
  }
  if (isXrpTransaction(tx)) {
    return jsBridges.xrp.serializationBridge[func](tx);
  }

  throw new CurrencyNotSupported("bridge not found " + tx.family);
}

function callSerializeBridgeFuncOnTransactionRaw(tx: TransactionCommonRaw, func: string) {
  if (isAlgorandTransactionRaw(tx)) {
    return jsBridges.algorand.serializationBridge[func](tx);
  }
  if (isAptosTransactionRaw(tx)) {
    return jsBridges.aptos.serializationBridge[func](tx);
  }
  if (isBitcoinTransactionRaw(tx)) {
    return jsBridges.bitcoin.serializationBridge[func](tx);
  }
  if (isCardanoTransactionRaw(tx)) {
    return jsBridges.cardano.serializationBridge[func](tx);
  }
  if (isCasperTransactionRaw(tx)) {
    return jsBridges.casper.serializationBridge[func](tx);
  }
  if (isCeloTransactionRaw(tx)) {
    return jsBridges.celo.serializationBridge[func](tx);
  }
  if (isCosmosTransactionRaw(tx)) {
    return jsBridges.cosmos.serializationBridge[func](tx);
  }
  if (isEvmTransactionRaw(tx)) {
    return jsBridges.evm.serializationBridge[func](tx);
  }
  if (isHederaTransactionRaw(tx)) {
    return jsBridges.hedera.serializationBridge[func](tx);
  }
  if (isFilecoinTransactionRaw(tx)) {
    return jsBridges.filecoin.serializationBridge[func](tx);
  }
  if (isInternetComputerTransactionRaw(tx)) {
    return jsBridges.internet_computer.serializationBridge[func](tx);
  }
  if (isIconTransactionRaw(tx)) {
    return jsBridges.icon.serializationBridge[func](tx);
  }
  if (isMinaTransactionRaw(tx)) {
    return jsBridges.mina.serializationBridge[func](tx);
  }
  if (isMultiversXTransactionRaw(tx)) {
    return jsBridges.multiversx.serializationBridge[func](tx);
  }
  if (isNearTransactionRaw(tx)) {
    return jsBridges.near.serializationBridge[func](tx);
  }
  if (isPolkadotTransactionRaw(tx)) {
    return jsBridges.polkadot.serializationBridge[func](tx);
  }
  if (isSolanaTransactionRaw(tx)) {
    return jsBridges.solana.serializationBridge[func](tx);
  }
  if (isStacksTransactionRaw(tx)) {
    return jsBridges.stacks.serializationBridge[func](tx);
  }
  if (isStellarTransactionRaw(tx)) {
    return jsBridges.stellar.serializationBridge[func](tx);
  }
  if (isSuiTransactionRaw(tx)) {
    return jsBridges.sui.serializationBridge[func](tx);
  }
  if (isTezosTransactionRaw(tx)) {
    return jsBridges.tezos.serializationBridge[func](tx);
  }
  if (isTonTransactionRaw(tx)) {
    return jsBridges.ton.serializationBridge[func](tx);
  }
  if (isTronTransactionRaw(tx)) {
    return jsBridges.tron.serializationBridge[func](tx);
  }
  if (isVechainTransactionRaw(tx)) {
    return jsBridges.vechain.serializationBridge[func](tx);
  }
  if (isXrpTransactionRaw(tx)) {
    return jsBridges.xrp.serializationBridge[func](tx);
  }

  throw new CurrencyNotSupported("bridge not found " + tx.family);
}
