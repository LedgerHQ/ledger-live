import type { AccountInfo, AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/coin-hedera/constants";
import type { HederaAccountInfo } from "@ledgerhq/coin-hedera/logic/getAccountInfo";
import { apiClient } from "@ledgerhq/coin-hedera/network/api";
import type { HederaCoinConfig, HederaResources, HederaTxData } from "@ledgerhq/coin-hedera/types";
import { buildContext } from "../../../bridge/generic-coin-framework/api/context";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type {
  BridgeApi,
  FamilyAccountShape,
  OptimisticOperationDescriptor,
} from "@ledgerhq/ledger-wallet-framework/api/types";
import type { GetAddressResult } from "@ledgerhq/ledger-wallet-framework/derivation";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { isStakingAccount, type Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

function isHederaAccountInfo(info: AccountInfo): info is HederaAccountInfo {
  return info.type === "hedera";
}

export function buildAccountShape(
  _address: string,
  accountInfo?: AccountInfo,
): FamilyAccountShape | undefined {
  if (!accountInfo || !isHederaAccountInfo(accountInfo)) return undefined;

  const delegation =
    typeof accountInfo.stakedNodeId === "number"
      ? {
          nodeId: accountInfo.stakedNodeId,
          // Hedera stakes the account's whole balance to a node, there is no separate staked amount.
          delegated: new BigNumber(accountInfo.balance),
          pendingReward: new BigNumber(accountInfo.pendingReward),
        }
      : null;

  const hederaResources: HederaResources = {
    maxAutomaticTokenAssociations: accountInfo.maxAutomaticTokenAssociations,
    isAutoTokenAssociationEnabled: accountInfo.maxAutomaticTokenAssociations === -1,
    delegation,
  };

  return { hederaResources };
}

export async function getTokenFromAsset(
  currency: CryptoCurrency,
  asset: AssetInfo,
): Promise<TokenCurrency | undefined> {
  if (asset.type === "native" || !("assetReference" in asset) || !asset.assetReference) {
    return undefined;
  }
  return getCryptoAssetsStore().findTokenByAddressInCurrency(asset.assetReference, currency.id);
}

export function getAssetFromToken(token: TokenCurrency, owner: string): AssetInfo {
  return {
    type: token.tokenType,
    assetReference: token.contractAddress,
    assetOwner: owner,
    name: token.name,
    unit: token.units[0],
  };
}

/** The only translation from the framework's mode spelling to coin-hedera's (LIVE-36150). */
export function computeIntentType(transaction: Record<string, unknown>): HEDERA_TRANSACTION_MODES {
  const mode = transaction.mode as string | undefined;

  switch (mode) {
    case "send":
    case undefined:
      return HEDERA_TRANSACTION_MODES.Send;
    case "tokenAssociate":
      return HEDERA_TRANSACTION_MODES.TokenAssociate;
    case "delegate":
      return HEDERA_TRANSACTION_MODES.Delegate;
    case "undelegate":
      return HEDERA_TRANSACTION_MODES.Undelegate;
    case "redelegate":
      return HEDERA_TRANSACTION_MODES.Redelegate;
    case "claimReward":
      return HEDERA_TRANSACTION_MODES.ClaimRewards;
    default:
      throw new Error(`Unsupported Hedera transaction mode: ${mode}`);
  }
}

// `craftTransaction` reads the staked node id and the gas limit from `intent.data` only, never from
// `intent.valId`/`intent.gasLimit` — without this hook a staking transaction signs and broadcasts
// while changing nothing (LIVE-36151).
export function buildIntentData(transaction: Record<string, unknown>): HederaTxData {
  const mode = transaction.mode as string | undefined;
  if (mode === "delegate" || mode === "redelegate" || mode === "undelegate") {
    const valId = transaction.valId as string | undefined;
    const stakingNodeId = typeof valId === "string" && valId !== "" ? Number(valId) : null;
    return { type: "staking", stakingNodeId };
  }
  const gasLimit = transaction.gasLimit;
  if (mode === "send" && gasLimit instanceof BigNumber) {
    return { type: "erc20", gasLimit: BigInt(gasLimit.toFixed(0)) };
  }
  return { type: "none" };
}

// A Hedera account id is handed out by the network, not derived from the public key, so only the
// mirror node can resolve one (ADR-055). An empty list stops the scan: accounts are created outside
// the wallet, so a key that owns nothing today cannot come to own something.
export function getAddressesByPublicKey(
  currency: CryptoCurrency,
): (derived: GetAddressResult) => Promise<string[]> {
  const context = buildContext<HederaCoinConfig>(currency.id);
  return async derived => {
    const accounts = await apiClient.getAccountsForPublicKey({
      // Pass config explicitly: the generic framework never seeds coin-hedera's registry (ADR-019).
      configOrCurrencyId: await context.config(),
      publicKey: derived.publicKey,
    });
    return accounts.map(a => a.account);
  };
}

// A claim carries no amount, so the optimistic row would show 0 until the next sync replaces it.
export function describeOptimisticOperation(
  mode: string,
  account: Account,
): OptimisticOperationDescriptor | undefined {
  if (mode !== "claimReward" || !isStakingAccount(account)) return undefined;
  return { value: account.stakingResources.pendingRewardsBalance };
}

export default function hederaBridge(currency: CryptoCurrency): BridgeApi {
  return {
    getTokenFromAsset: (asset: AssetInfo) => getTokenFromAsset(currency, asset),
    getAssetFromToken: (token: TokenCurrency, owner: string) => getAssetFromToken(token, owner),
    describeOptimisticOperation,
    getAddressesByPublicKey: getAddressesByPublicKey(currency),
    // A `44/3030` path resolves to one key, and the mirror node reports every account it owns.
    keyOwnsSeveralAccounts: true,
    buildAccountShape,
    computeIntentType,
    buildIntentData,
    stakingSupported: true,
    // `Operation.id` format changed from the legacy bridge's.
    syncVersion: "1",
    shouldMergeOps: false,
  } satisfies BridgeApi;
}
