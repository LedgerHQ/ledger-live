import type { AccountInfo } from "@ledgerhq/coin-module-framework/api/types";
import type {
  AddressLookup,
  ChainReads,
  FamilyAddressLookup,
  TransactionInfo,
} from "@ledgerhq/ledger-wallet-framework/api/types";
import { ChainReadUnsupportedError } from "@ledgerhq/ledger-wallet-framework/errors";
import {
  isUnsupported,
  type JsonValue,
  type Network,
  type NetworkExtensionMethod,
  type PortfolioApi,
  type TransactionInfoView,
} from "@ledgerhq/portfolio-module-framework";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { legacyChainReadsFor } from "./legacyChainReads";
import { openCurrencyPortfolio } from "./networkPortfolio";
import { isPortfolioEnabledFor } from "./portfolio/config";

/** A transaction as the network knows it, in memory: block time a Date, amounts bigints. */
export function fromTransactionInfoView(view: TransactionInfoView): TransactionInfo {
  const { hash, block, fee, value, sequence, data } = view;
  return {
    hash,
    block: block && { height: block.height, hash: block.hash, time: new Date(block.time) },
    ...(fee === undefined ? {} : { fee: BigInt(fee) }),
    ...(value === undefined ? {} : { value: BigInt(value) }),
    ...(sequence === undefined ? {} : { sequence: BigInt(sequence) }),
    ...(data === undefined ? {} : { data }),
  };
}

/**
 * The chain reads of a currency served by the portfolio layer: every read goes through `portfolio`
 * (the router routes it to the side serving it). A read the portfolio does not serve (the extension
 * is absent, or it answers METHOD_NOT_ALLOWED) rejects with `ChainReadUnsupportedError`, which a hook
 * maps to an absent value; any other rejection propagates. `getAccountInfo` is read once per address.
 */
export function portfolioChainReads({
  portfolio,
  network,
}: {
  portfolio: PortfolioApi;
  network: Network;
}): ChainReads {
  const served = async <A extends unknown[], R>(
    name: NetworkExtensionMethod | "getNextSequence",
    method: ((network: Network, ...args: A) => Promise<R>) | undefined,
    ...args: A
  ): Promise<R> => {
    const message = `${name} is not served for ${network}`;
    if (!method) throw new ChainReadUnsupportedError(message);
    try {
      return await method.call(portfolio, network, ...args);
    } catch (error) {
      if (isUnsupported(error))
        throw new ChainReadUnsupportedError(message, undefined, { cause: error });
      throw error;
    }
  };

  const accountInfos = new Map<string, Promise<AccountInfo>>();
  return {
    getAccountInfo: address => {
      let info = accountInfos.get(address);
      if (!info) {
        info = served("getAccountInfo", portfolio.getAccountInfo, address);
        accountInfos.set(address, info);
      }
      return info;
    },
    call: async params =>
      (await served("call", portfolio.call, { params: params as JsonValue })).result,
    getNextSequence: async address =>
      BigInt((await served("getNextSequence", portfolio.getNextSequence, address)).value),
    getAddressesForPublicKey: async publicKey =>
      (await served("getAddressesForPublicKey", portfolio.getAddressesForPublicKey, publicKey))
        .addresses,
    getTransactionInfo: async hash => {
      const view = await served("getTransactionInfo", portfolio.getTransactionInfo, hash);
      return view && fromTransactionInfoView(view);
    },
  };
}

/**
 * The chain reads of a currency, outside an account sync (broadcast, scan): through its portfolio
 * when its coin config enables it, through the coin module and the family's legacy reads otherwise.
 */
export async function chainReadsFor(currency: CryptoCurrency): Promise<ChainReads> {
  if (isPortfolioEnabledFor(currency.id)) {
    return portfolioChainReads(await openCurrencyPortfolio(currency, "read"));
  }
  return legacyChainReadsFor(currency);
}

/**
 * The address lookup jsHelpers calls, from the one a family declares: its chain reads are built when
 * it looks addresses up only, so `receive` (which checks the device key offline) opens nothing.
 */
export function bindAddressLookup(
  lookup: FamilyAddressLookup,
  currency: CryptoCurrency,
): AddressLookup {
  return {
    getAddresses: async derived => lookup.getAddresses(derived, await chainReadsFor(currency)),
    keyControlsAccount: lookup.keyControlsAccount,
  };
}
