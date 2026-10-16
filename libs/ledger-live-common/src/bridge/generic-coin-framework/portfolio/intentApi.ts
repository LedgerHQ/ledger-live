import BigNumber from "bignumber.js";
import {
  fromJsonOperation,
  toJsonSafe,
  type JsonOperation,
} from "@ledgerhq/account-module-framework";
import type {
  AssetInfo,
  CoinModuleApi,
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/types";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountModuleBinding, BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import {
  assetKeyOf,
  isUnsupported,
  type AssetInfoView,
  type FeesStrategy,
  type PortfolioMode,
  type TransactionIntentView,
  type TransactionValidationView,
} from "@ledgerhq/portfolio-module-framework";
import { writeSide } from "@ledgerhq/portfolio-module-hybrid";
import type { Account } from "@ledgerhq/types-live";
import { accountPathOf, intentApiFor, type IntentApi } from "../accountModule";
import { buildContext } from "../api/context";
import {
  openAccountPortfolio,
  type AccountPortfolio,
  type PortfolioAccountSource,
} from "./account";
import { isPortfolioEnabledFor } from "./config";
import { validationFromView } from "./models";
import type { PortfolioDeps } from "./network";

const FEES_STRATEGIES: readonly unknown[] = ["fast", "medium", "slow"] satisfies FeesStrategy[];

const isFeesStrategy = (value: unknown): value is FeesStrategy => FEES_STRATEGIES.includes(value);

/** The native asset itself: a Cardano token has the type "native" too, and a reference. */
const isPlainNative = (asset: AssetInfo): boolean =>
  asset.type === "native" && !("assetReference" in asset && asset.assetReference);

/** A synced Ledger Wallet account, as the portfolio layer serves it. */
export function accountSource(
  binding: AccountModuleBinding | undefined,
  account: Account,
): PortfolioAccountSource {
  return {
    currency: account.currency,
    accountId: account.id,
    key: binding ? decodeAccountId(account.id).xpubOrAddress : account.freshAddress,
    derivationMode: account.derivationMode,
    derivationPath: binding ? accountPathOf(account.freshAddressPath) : account.freshAddressPath,
    index: account.index,
    account,
  };
}

/**
 * The form the service receives of what JSON has none for: a map as an object, bytes as hex, a
 * BigNumber as a decimal string. Any other set or typed array fails rather than being dropped.
 */
export function toWireForm(value: unknown): unknown {
  if (value instanceof Map) {
    return Object.fromEntries([...value].map(([key, item]) => [String(key), toWireForm(item)]));
  }
  if (value instanceof Uint8Array) return Buffer.from(value).toString("hex");
  if (BigNumber.isBigNumber(value)) return value.toFixed();
  if (value instanceof Set || ArrayBuffer.isView(value)) {
    throw new Error(`No wire form for a ${value.constructor.name} in the intent of the service`);
  }
  if (Array.isArray(value)) return value.map(toWireForm);
  if (typeof value === "object" && value !== null && !(value instanceof Date)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toWireForm(item)]));
  }
  return value;
}

type ViewOptions = {
  /** The account key: the local side writes through the account module of the account it keys. */
  sender: string;
  /**
   * The fee options of the call, which the local side hands to the modules: present wherever the
   * legacy path passes some (estimate, validation, craft), even empty; absent for a send-max
   * estimate.
   */
  feeParameters: Record<string, unknown> | undefined;
  accountOptions: unknown;
  mode: PortfolioMode;
};

/**
 * The portfolio intent of a coin module intent. What the common fields do not carry (data, memo,
 * useAllAmount, the sequence, the staking fields, the account module options, the fee parameters
 * under `feeParameters`) rides in `networkParams`.
 *
 * When the client writes, the local side spreads `networkParams` into the coin module intent as
 * it is, so every field keeps its exact presence, the sequence and the fees strategy included; the
 * intent also carries its asset (`assetInfo`, native included: the coin module gets the name and
 * unit it gets on the legacy path) and its type. When the service writes, `networkParams` takes its
 * wire form (JSON, see `toWireForm`), a negative sequence is left to the service, and the fees
 * strategy is the common field.
 */
export function toIntentView(
  intent: TransactionIntent<any, any>,
  { sender, feeParameters, accountOptions, mode }: ViewOptions,
): TransactionIntentView {
  const {
    intentType,
    type,
    sender: _sender,
    senderPublicKey,
    recipient,
    amount,
    asset,
    ...fields
  } = intent;
  const common = { type, sender, amount: amount.toString(), asset: assetKeyOf(asset) };
  const options = {
    ...(accountOptions === undefined ? {} : { accountOptions }),
    // The key portfolio-module-local hands to the modules as fee options.
    ...(feeParameters === undefined ? {} : { feeParameters }),
  };

  if (writeSide(mode) === "local") {
    return {
      ...common,
      ...(senderPublicKey === undefined ? {} : { senderPublicKey }),
      ...(recipient === undefined ? {} : { recipient }),
      assetInfo: asset as AssetInfoView,
      intentType,
      networkParams: { ...fields, ...options },
    };
  }

  const { feesStrategy, sequence, ...rest } = fields;
  const strategy = [feeParameters?.feesStrategy, feesStrategy].find(isFeesStrategy);
  const networkParams = {
    ...rest,
    ...(typeof sequence === "bigint" && sequence >= 0n ? { sequence } : {}),
    ...options,
  };
  return {
    ...common,
    ...(senderPublicKey ? { senderPublicKey } : {}),
    ...(recipient ? { recipient } : {}),
    ...(strategy ? { feesStrategy: strategy } : {}),
    networkParams: toJsonSafe(toWireForm(networkParams)),
  };
}

/**
 * What the service cannot write is refused when it writes, the local side writing it all:
 *
 * - an account served by an account module (bitcoin): its key is an extended public key, and the
 *   service writes from a single sender address, crafting no UTXO transaction;
 * - a staking intent, or a token one (a Cardano token has the native type): the service's intent
 *   carries a plain native transfer only, so it would sign a plain transfer of the same amount.
 */
function assertServed(
  currencyId: string,
  intent: TransactionIntent<any, any>,
  mode: PortfolioMode,
  binding: AccountModuleBinding | undefined,
): void {
  if (writeSide(mode) !== "remote") return;
  if (binding !== undefined) {
    throw new Error(
      `${currencyId}: accounts served by an account module are not written by the portfolio-service (use the hybrid mode)`,
    );
  }
  if (intent.intentType === "staking" || !isPlainNative(intent.asset)) {
    throw new Error(
      `${currencyId}: ${intent.intentType} intents on ${intent.asset.type} assets are not served by the portfolio-service`,
    );
  }
}

/**
 * The status of an intent the side writing cannot validate (the portfolio-service serves no
 * validation, a limitation of the `remote` mode): unvalidated, so nothing blocks the send there;
 * the fee the client set (0 without one), the intent's amount, and the fee on top of it for the
 * native asset. The service still refuses what it cannot craft or broadcast.
 */
export function unvalidatedStatus(
  intent: TransactionIntent<any, any>,
  customFee: bigint | undefined,
): TransactionValidation {
  const fee = customFee ?? 0n;
  return {
    errors: {},
    warnings: {},
    estimatedFees: fee,
    amount: intent.amount,
    totalSpent: isPlainNative(intent.asset) ? intent.amount + fee : intent.amount,
  };
}

/**
 * The crafted transaction of an encoded one: its details when they are an object, and the
 * optimistic operation the local side answers in `details.operation`, back in its own form. The
 * service answers none: its details are kept as they are.
 */
function craftedOf(rawTransaction: string, details: unknown, mode: PortfolioMode) {
  if (typeof details !== "object" || details === null || Array.isArray(details)) {
    return { transaction: rawTransaction };
  }
  if (writeSide(mode) !== "local") {
    return { transaction: rawTransaction, details: details as Record<string, unknown> };
  }
  const { operation, ...rest } = details as { operation?: JsonOperation };
  return {
    transaction: rawTransaction,
    details: rest,
    ...(operation === undefined ? {} : { operation: fromJsonOperation(operation) }),
  };
}

/** The family's catalog lookups and balance options, which seed and serve the local side. */
export type WriteBridgeApi = Pick<
  BridgeApi,
  "accountModule" | "getAssetFromToken" | "getTokenFromAsset" | "balanceOptions"
>;

/**
 * The write path of an account served by the portfolio layer: every call goes through the side
 * writing for its chain (the local side, or the service in `remote` mode), on one portfolio opened
 * for the write. Craft and combine must use the same instance: the local side keeps what the
 * account module crafted until it is combined.
 *
 * - The side writing completes the `data` of an intent itself: the coin module of the local side,
 *   or the account module; Ledger Wallet leaves it undefined.
 * - The network sequence comes from the side writing, in every mode.
 * - The validation is the side writing's: the local side validates with the balances Ledger Wallet
 *   seeded its state with (`moduleStateOf`), the ones the legacy path validates with, so the
 *   balances handed to `validateIntent` are not used. The service serves none: in `remote` mode the
 *   status is unvalidated (`unvalidatedStatus`).
 */
export function portfolioIntentApi({
  binding,
  coinModuleApi,
  account,
  transaction,
  bridgeApi = {},
}: {
  binding: AccountModuleBinding | undefined;
  coinModuleApi: CoinModuleApi<any, any, any>;
  account: Account;
  transaction: Record<string, unknown>;
  bridgeApi?: PortfolioDeps["bridgeApi"];
}): IntentApi {
  const source = accountSource(binding, account);
  const { id: currencyId, family } = account.currency;
  let opening: Promise<AccountPortfolio> | undefined;
  const opened = () =>
    (opening ??= openAccountPortfolio(
      source,
      { binding, coinModuleApi, context: buildContext(currencyId), bridgeApi },
      "write",
    ));
  const accountOptions = binding?.accountOptions?.(transaction);
  const view = (
    intent: TransactionIntent<any, any>,
    feeParameters: Record<string, unknown> | undefined,
    mode: PortfolioMode,
  ) => toIntentView(intent, { sender: source.key, feeParameters, accountOptions, mode });

  return {
    craftTransactionData: () => undefined,

    getNextSequence: async (_context, address) => {
      const { portfolio, network } = await opened();
      return BigInt((await portfolio.getNextSequence(network, address)).value);
    },

    validateIntent: async (_context, intent, _balances, options) => {
      const { portfolio, network, mode } = await opened();
      const customFees = options?.customFees;
      let validation: TransactionValidationView;
      try {
        validation = await portfolio.validateTransaction(network, {
          intent: view(intent, customFees?.parameters, mode),
          ...(customFees === undefined ? {} : { customFees: customFees.value.toString() }),
        });
      } catch (error) {
        if (writeSide(mode) === "remote" && isUnsupported(error)) {
          return unvalidatedStatus(intent, customFees?.value);
        }
        throw error;
      }
      return validationFromView(validation, family);
    },

    estimateFees: async (_context, intent, options) => {
      const { portfolio, network, mode } = await opened();
      assertServed(currencyId, intent, mode, binding);
      const { value, parameters } = await portfolio.estimateTransactionFee(network, {
        intent: view(intent, options?.customFeesParameters, mode),
      });
      return {
        value: BigInt(value),
        ...(parameters === undefined ? {} : { parameters: parameters as Record<string, unknown> }),
      };
    },

    craftTransaction: async (_context, intent, options) => {
      const { portfolio, network, mode } = await opened();
      assertServed(currencyId, intent, mode, binding);
      const customFees = options?.customFees;
      const { rawTransaction, details } = await portfolio.encodeTransaction(network, {
        intent: view(intent, customFees?.parameters, mode),
        ...(customFees === undefined ? {} : { customFees: customFees.value.toString() }),
      });
      return craftedOf(rawTransaction, details, mode);
    },

    combine: async (_context, transaction, signatures, options) => {
      const { portfolio, network } = await opened();
      const { signedTransaction } = await portfolio.combineTransaction(network, {
        rawTransaction: transaction,
        signature: signatures[0],
        ...(options?.pubkey === undefined ? {} : { pubkey: options.pubkey }),
      });
      return signedTransaction;
    },
  };
}

/**
 * The write path of an account: through the portfolio layer when the coin config of its currency
 * enables it (`portfolio.enabled`), the legacy one otherwise.
 */
export function writeIntentApi(
  bridgeApi: WriteBridgeApi,
  coinModuleApi: CoinModuleApi<any, any, any>,
  account: Account,
  transaction: Record<string, unknown>,
): IntentApi {
  if (!isPortfolioEnabledFor(account.currency.id)) {
    return intentApiFor(bridgeApi, coinModuleApi, account, transaction);
  }
  return portfolioIntentApi({
    binding: bridgeApi.accountModule,
    coinModuleApi,
    account,
    transaction,
    bridgeApi,
  });
}

/** Broadcasts a signed transaction of an account through the side writing for its chain. */
export async function portfolioBroadcast(
  binding: AccountModuleBinding | undefined,
  coinModuleApi: CoinModuleApi<any, any, any>,
  account: Account,
  signedTransaction: string,
): Promise<string> {
  const { portfolio, network } = await openAccountPortfolio(
    accountSource(binding, account),
    { binding, coinModuleApi, context: buildContext(account.currency.id), bridgeApi: {} },
    "write",
  );
  const { transactionId } = await portfolio.broadcastTransaction(network, { signedTransaction });
  return transactionId;
}
