import { CurrencyNotSupported } from "@ledgerhq/errors";
import { decodeAccountId, getMainAccount } from "../account";
import { getEnv } from "@ledgerhq/live-env";
import { checkAccountSupported } from "../account/index";
import jsBridges from "../generated/bridge/js";
import mockBridges from "../generated/bridge/mock";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountBridge, AccountLike, Bridge, CurrencyBridge, SerializationBridge, TransactionCommon, TransactionCommonRaw } from "@ledgerhq/types-live";
import { Transaction, TransactionRaw } from "../generated/types";
import { AlgorandBridge } from "@ledgerhq/coin-algorand/types";
import { AptosBridge } from "@ledgerhq/coin-aptos/index";
import { BitcoinBridge } from "@ledgerhq/coin-bitcoin/bridge/js";
import { CardanoBridge } from "@ledgerhq/coin-cardano/types";
import { CeloBridge } from "@ledgerhq/coin-celo/bridge/index";
import { FilecoinBridge } from "@ledgerhq/coin-filecoin/index";
import { MinaBridge } from "@ledgerhq/coin-mina/bridge/index";
import { NearBridge } from "@ledgerhq/coin-near/bridge/js";
import { PolkadotBridge } from "@ledgerhq/coin-polkadot/index";
import { SolanaBridge } from "@ledgerhq/coin-solana/bridge/bridge";
import { StacksBridge } from "@ledgerhq/coin-stacks/index";
import { StellarBridge } from "@ledgerhq/coin-stellar/bridge/index";
import { SuiBridge } from "@ledgerhq/coin-sui";
import { TezosBridge } from "@ledgerhq/coin-tezos/bridge/index";
import { TonBridge } from "@ledgerhq/coin-ton/bridge/js";
import { TronBridge } from "@ledgerhq/coin-tron/index";
import { VechainBridge } from "@ledgerhq/coin-vechain/index";
import { CasperBridge } from "../families/casper/types";
import { CosmosBridge } from "../families/cosmos/types";
import { HederaBridge } from "../families/hedera/types";
import { IconBridge } from "../families/icon/types";
import { XrpBridge } from "@ledgerhq/coin-xrp/index";

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

export function getBridgeByFamily(family: string, accountId?: string): Bridge<any> {
  if (accountId) {
    const { type } = decodeAccountId(accountId);

    if (type === "mock") {
      const mockBridge = mockBridges[family];
      if (mockBridge) return mockBridge.accountBridge;
    }
  }

  const jsBridge = jsBridges[family];
  if (!jsBridge) {
    throw new CurrencyNotSupported("bridge not found " + family);
  }
  return jsBridge;
}

type CoinBridge =
  | AlgorandBridge
  | AptosBridge
  | BitcoinBridge
  | CardanoBridge
  | CasperBridge
  | CeloBridge
  | CosmosBridge
  // | EvmBridge
  | FilecoinBridge
  | HederaBridge
  | IconBridge
  // | Internet_computerBridge
  | MinaBridge
  // | MultiversxBridge
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

export function getBridgeByTransaction(tx: Transaction | TransactionRaw): CoinBridge {
  switch (tx.family) {
    case "aptos":
      return jsBridges.aptos;
    default:
      throw new Error("Unsupported coin family");
      return jsBridges.aptos;
  }
}
export function getBridgeByTransaction2<
  T extends TransactionCommon,
  TR extends TransactionCommonRaw,
>(tx: T | TR): SerializationBridge<T, TR> {
  switch (tx.family) {
    case "aptos":
      return jsBridges.aptos.serializationBridge;
    default:
      throw new Error("Unsupported coin family");
  }
}
