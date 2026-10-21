import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { decodeTokenAccountIdSync } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { log } from "@ledgerhq/logs";
import type {
  BridgeApi,
  OptimisticOperationDescriptor,
} from "@ledgerhq/ledger-wallet-framework/api/types";
import type {
  Account,
  OperationType,
  StakingDelegation,
  StakingUnbonding,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { getChainAPI } from "@ledgerhq/coin-solana/network/index";
import {
  endpointByCurrencyId,
  transactionHasNonPlaceholderSignatures,
} from "@ledgerhq/coin-solana/utils";
import { VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import { getTokenAccountShapes } from "@ledgerhq/coin-solana/logic/tokenAccountShapes";
import { getCurrencyConfiguration } from "../../../config";
import type { SolanaCoinConfig } from "@ledgerhq/coin-solana/config";
import type { SolanaTransactionIntentData } from "../types";
import { getStakeCreationDeposit } from "../transactions";

export function getTokenFromAsset(
  currency: CryptoCurrency,
  asset: AssetInfo,
): Promise<TokenCurrency | undefined> {
  if (asset.type === "native" || !("assetReference" in asset) || !asset.assetReference) {
    return Promise.resolve(undefined);
  }
  return getCryptoAssetsStore().findTokenByAddressInCurrency(asset.assetReference, currency.id);
}

export function getAssetFromToken(token: TokenCurrency, owner: string): AssetInfo {
  return {
    type: token.tokenType,
    assetReference: token.contractAddress,
    assetOwner: owner,
  };
}

export function computeIntentType(transaction: Record<string, unknown>): string {
  const mode = transaction.mode as string | undefined;

  switch (mode) {
    case "send":
    case undefined:
      return "send";
    case "stake":
      return "stake.createAccount";
    case "delegate":
      return "stake.delegate";
    case "undelegate":
      return "stake.undelegate";
    case "unstake":
      return "stake.withdraw";
    case "opt-in":
      return "token.createATA";
    case "approve":
      return "token.approve";
    case "revoke":
      return "token.revoke";
    case "split":
      return "stake.split";
    default:
      throw new Error(`Unsupported Solana transaction mode: ${mode}`);
  }
}

export function buildIntentData(transaction: Record<string, unknown>): SolanaTransactionIntentData {
  const { raw, familySpecificData } = transaction as {
    raw?: string;
    familySpecificData?: { stakeAccountSeed?: string };
  };
  if (raw) return { type: "buffer", value: Buffer.from(raw, "base64") };

  const { stakeAccountSeed } = familySpecificData ?? {};
  if (stakeAccountSeed) return { type: "stakeAccountSeed", value: stakeAccountSeed };

  return { type: "none" };
}

const STAKING_OPERATION_TYPES: Record<string, OperationType> = {
  "opt-in": "OPT_IN",
  stake: "DELEGATE",
  delegate: "DELEGATE",
  undelegate: "UNDELEGATE",
  unstake: "WITHDRAW_UNBONDED",
  split: "FEES",
  approve: "FEES",
  revoke: "FEES",
};

export function describeOptimisticOperation(
  mode: string,
  _account: Account,
  transaction: Record<string, unknown>,
): OptimisticOperationDescriptor | undefined {
  const type = STAKING_OPERATION_TYPES[mode];
  if (!type) return undefined;

  // `getPendingNativeSpent` locks `operation.fee` on its own, so `value` is the principal only.
  if (mode !== "stake") return { type, value: new BigNumber(0) };

  return {
    type,
    value: getStakeCreationDeposit({
      amount: (transaction.amount as BigNumber | undefined) ?? new BigNumber(0),
      stakeAccountRent: transaction.stakeAccountRent as BigNumber | undefined,
      useAllAmount: transaction.useAllAmount as boolean | undefined,
    }),
  };
}

async function buildTokenAccountShapes(currency: CryptoCurrency, address: string) {
  try {
    const config = getCurrencyConfiguration<SolanaCoinConfig>(currency.id);
    const api = getChainAPI({ endpoint: endpointByCurrencyId(config, currency.id) });
    return await getTokenAccountShapes(api, address);
  } catch (error) {
    // Recoverable: the sync goes on without the frozen state and Token-2022 extensions.
    log(currency.id, "token account shapes unavailable", { error: String(error) });
    return {};
  }
}

/**
 * The mint is the fallback match: the wallet API signs against a placeholder sub-account, absent
 * from the synced account when the token is not held yet. Its id still encodes the token id, which a
 * legacy id, ending with the token account address, does not.
 */
function tokenIdOfSubAccount(
  account: Account,
  subAccountId: string,
  assetReference: string | undefined,
): string | undefined {
  const token =
    account.subAccounts?.find(sub => sub.id === subAccountId)?.token ??
    account.subAccounts?.find(sub => sub.token?.contractAddress === assetReference)?.token;
  if (token) return token.id;
  const { tokenId } = decodeTokenAccountIdSync(subAccountId);
  return tokenId.startsWith(`${account.currency.id}/`) ? tokenId : undefined;
}

// The blockhash a signature was refreshed to, keyed on the options object that carried the callback.
const refreshedBlockhashes = new WeakMap<object, string>();

/** A raw transaction already carrying a real signature is a co-signed one: its message is final. */
function hasRealSignatures(raw: unknown): boolean {
  if (typeof raw !== "string" || raw === "") return false;
  try {
    const { signatures } = VersionedTransaction.deserialize(Buffer.from(raw, "base64"));
    return transactionHasNonPlaceholderSignatures(signatures);
  } catch {
    return false;
  }
}

/**
 * What the device needs to name a token recipient instead of showing its raw account, and to take a
 * fresh blockhash once the user has reviewed the transaction: a review longer than the blockhash's
 * lifetime would otherwise fail at broadcast. The legacy signer additionally wants `deviceModelId`,
 * which no signing context reaches this hook — see LIVE-35692.
 */
export function getDeviceSignOptions(
  transaction: Record<string, unknown>,
  account: Account,
): Record<string, unknown> | undefined {
  const {
    templateId,
    subAccountId,
    recipientTokenAccount,
    recipientWalletAddress,
    userInputType,
    assetReference,
    mode,
    raw,
  } = transaction as {
    templateId?: string;
    subAccountId?: string;
    recipientTokenAccount?: string;
    recipientWalletAddress?: string;
    userInputType?: string;
    assetReference?: string;
    mode?: string;
    raw?: string;
  };

  // Opening an account names its future owner; a transfer that opens one names the recipient.
  const ataToOpen =
    mode === "opt-in" ? account.freshAddress : (recipientWalletAddress ?? undefined);

  // The CAL descriptor names the token being moved, which an account opening does not move yet;
  // the legacy resolution omits it there too.
  const tokenInternalId =
    subAccountId && mode !== "opt-in"
      ? tokenIdOfSubAccount(account, subAccountId, assetReference)
      : undefined;

  let destination = {};
  if (ataToOpen && assetReference) {
    destination = { createATA: { address: ataToOpen, mintAddress: assetReference } };
  } else if (recipientTokenAccount) {
    destination = { tokenAddress: recipientTokenAccount };
  }

  const endpoint = endpointByCurrencyId(
    getCurrencyConfiguration<SolanaCoinConfig>(account.currency.id),
    account.currency.id,
  );

  const options: Record<string, unknown> = {
    ...(templateId ? { templateId } : {}),
    ...(tokenInternalId ? { tokenInternalId } : {}),
    ...destination,
    ...(userInputType ? { userInputType } : {}),
    solanaRPCURL: endpoint,
  };

  if (!hasRealSignatures(raw)) {
    options.delayed = true;
    options.fetchBlockhash = async () => {
      const { blockhash } = await getChainAPI({ endpoint }).getLatestBlockhash("confirmed");
      refreshedBlockhashes.set(options, blockhash);
      return bs58.decode(blockhash);
    };
  }

  return options;
}

/**
 * The device signs the message with the blockhash `fetchBlockhash` returned, so that is the one the
 * signature has to be combined with, not the one the transaction was crafted with.
 */
export function applyDeviceSignResult(
  unsigned: string,
  options: Record<string, unknown> | undefined,
): string {
  const blockhash = options && refreshedBlockhashes.get(options);
  if (!blockhash) return unsigned;

  const transaction = VersionedTransaction.deserialize(Buffer.from(unsigned, "base64"));
  transaction.message.recentBlockhash = blockhash;
  return Buffer.from(transaction.serialize()).toString("base64");
}

export function getHeldNativeAmount(position: StakingDelegation | StakingUnbonding): BigNumber {
  const reserve = position.lockedReserve ?? 0;
  if (position.activeAmount && position.inactiveAmount) {
    return position.activeAmount.plus(position.inactiveAmount).plus(reserve);
  }
  return position.amount.plus(reserve);
}

export default function solanaBridge(currency: CryptoCurrency): BridgeApi {
  return {
    stakingSupported: true,
    partitionsNativeBalance: true,
    balanceListsEveryToken: true,
    getHeldNativeAmount,
    getTokenFromAsset: (asset: AssetInfo) => getTokenFromAsset(currency, asset),
    getAssetFromToken: (token: TokenCurrency, owner: string) => getAssetFromToken(token, owner),
    computeIntentType: (transaction: Record<string, unknown>) => computeIntentType(transaction),
    buildIntentData,
    buildTokenAccountShapes: (address: string) => buildTokenAccountShapes(currency, address),
    describeOptimisticOperation,
    getDeviceSignOptions,
    applyDeviceSignResult,
  };
}
