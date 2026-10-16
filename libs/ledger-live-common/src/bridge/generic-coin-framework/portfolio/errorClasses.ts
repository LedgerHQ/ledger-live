import { UtxoAccountNotSyncedError } from "@ledgerhq/account-module-utxo";
import * as coinFrameworkErrors from "@ledgerhq/coin-module-framework/errors";
import * as walletFrameworkErrors from "@ledgerhq/ledger-wallet-framework/errors";
import * as sanctionErrors from "@ledgerhq/ledger-wallet-framework/sanction/errors";
import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import * as bitcoinErrors from "@ledgerhq/coin-bitcoin/errors";
import * as cantonErrors from "@ledgerhq/coin-canton/errors";
import * as cantonTypeErrors from "@ledgerhq/coin-canton/types/errors";
import * as cardanoErrors from "@ledgerhq/coin-cardano/errors";
import * as casperErrors from "@ledgerhq/coin-casper/errors";
import * as celoErrors from "@ledgerhq/coin-celo/errors";
import * as cosmosErrors from "@ledgerhq/coin-cosmos/errors";
import * as evmErrors from "@ledgerhq/coin-evm/errors";
import * as hederaErrors from "@ledgerhq/coin-hedera/errors";
import * as kaspaErrors from "@ledgerhq/coin-kaspa/errors";
import * as kaspaTypeErrors from "@ledgerhq/coin-kaspa/types/errors";
import * as multiversxErrors from "@ledgerhq/coin-multiversx/errors";
import * as nearErrors from "@ledgerhq/coin-near/errors";
import * as solanaErrors from "@ledgerhq/coin-solana/errors";
import * as stacksErrors from "@ledgerhq/coin-stacks/errors";
import * as stellarErrors from "@ledgerhq/coin-stellar/errors";
import * as tezosErrors from "@ledgerhq/coin-tezos/errors";
import * as tronErrors from "@ledgerhq/coin-tron/types/errors";
import * as vechainErrors from "@ledgerhq/coin-vechain/errors";
import * as xrpTypes from "@ledgerhq/coin-xrp/types";
import * as liveCommonErrors from "../../../errors";

/** A module's exports: its error classes are those deriving from `Error`. */
export type ErrorModule = Readonly<Record<string, unknown>>;

export type ErrorClass = new (...args: never[]) => Error;

const isErrorClass = (value: unknown): value is ErrorClass =>
  typeof value === "function" && value.prototype instanceof Error;

/**
 * The name an instance of `ErrorClass` carries: the one an `ErrorView` names it by. It may differ
 * from the export (`BitcoinInfrastructureError` is an `InfrastructureError`), and minifiers rename
 * classes; an instance tells it, the export name only when the class cannot be built bare.
 */
function instanceName(ErrorClass: ErrorClass, exportName: string): string {
  try {
    return new (ErrorClass as new () => Error)().name;
  } catch {
    return exportName;
  }
}

/**
 * The error classes `module` exports, by the name of their instances; the first export of a name
 * wins. A class whose instances keep the name "Error" cannot be told apart by name: it is left out.
 */
export function errorClassesOf(module: ErrorModule): Map<string, ErrorClass> {
  const classes = new Map<string, ErrorClass>();
  for (const [exportName, value] of Object.entries(module)) {
    if (!isErrorClass(value)) continue;
    const name = instanceName(value, exportName);
    if (name !== "Error" && !classes.has(name)) classes.set(name, value);
  }
  return classes;
}

/**
 * The modules whose errors every network may fail with, first the ones of the coin modules not
 * named below: the wallet framework's (most coin modules import theirs) and its sanction errors
 * (coin-bitcoin's validation reports a sanctioned sender with them), the portfolio layer's, the
 * account modules', the coin module framework's, and Ledger Wallet's own (including the network
 * errors of `@ledgerhq/live-network` it re-exports).
 */
export const SHARED_ERROR_MODULES: readonly ErrorModule[] = [
  walletFrameworkErrors,
  sanctionErrors,
  { PortfolioApiError },
  { UtxoAccountNotSyncedError },
  coinFrameworkErrors,
  liveCommonErrors,
];

/**
 * The errors module of each generic coin module, by family, before the shared ones. A name several
 * modules declare (`NotEnoughBalance`, `NotEnoughGas`, `ValAddressRequired`...) revives as the class
 * the family's coin module throws: its own, else the framework its validation imports them from,
 * the coin module framework (listed with the family) or the wallet framework (shared, first).
 */
export const FAMILY_ERROR_MODULES: ReadonlyMap<string, readonly ErrorModule[]> = new Map([
  ["bitcoin", [bitcoinErrors]],
  ["canton", [cantonErrors, cantonTypeErrors]],
  ["cardano", [cardanoErrors]],
  ["casper", [casperErrors]],
  ["celo", [celoErrors]],
  ["cosmos", [cosmosErrors]],
  ["evm", [evmErrors, coinFrameworkErrors]],
  ["hedera", [hederaErrors]],
  ["hypercore", [coinFrameworkErrors]],
  ["kaspa", [kaspaErrors, kaspaTypeErrors]],
  ["multiversx", [multiversxErrors]],
  ["near", [nearErrors, coinFrameworkErrors]],
  ["solana", [solanaErrors]],
  ["stacks", [stacksErrors, coinFrameworkErrors]],
  ["stellar", [stellarErrors, coinFrameworkErrors]],
  ["tezos", [tezosErrors, coinFrameworkErrors]],
  ["tron", [tronErrors, coinFrameworkErrors]],
  ["vechain", [vechainErrors]],
  ["xrp", [xrpTypes, coinFrameworkErrors]],
]);

const registries = new Map<string, ReadonlyMap<string, ErrorClass>>();

/**
 * The error class of each name an `ErrorView` of `family` may carry: the family's modules first,
 * then the shared ones. Without a family (or for one not listed), the shared ones alone.
 */
export function errorRegistry(family?: string): ReadonlyMap<string, ErrorClass> {
  const key = family ?? "";
  const known = registries.get(key);
  if (known) return known;
  const registry = new Map<string, ErrorClass>();
  for (const module of [...(FAMILY_ERROR_MODULES.get(key) ?? []), ...SHARED_ERROR_MODULES]) {
    for (const [name, ErrorClass] of errorClassesOf(module)) {
      if (!registry.has(name)) registry.set(name, ErrorClass);
    }
  }
  registries.set(key, registry);
  return registry;
}
