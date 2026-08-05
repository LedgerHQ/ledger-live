import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { fetchTronAccount } from "@ledgerhq/coin-tron/network";
import { defaultTronResources, fetchTronResources } from "@ledgerhq/coin-tron/resources";
import type { TronAccount, TronOperationMode, TronTxData } from "@ledgerhq/coin-tron/types/index";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type {
  BridgeApi,
  OptimisticOperationDescriptor,
} from "@ledgerhq/ledger-wallet-framework/api/types";
import type { Account, OperationType } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { BigNumber } from "bignumber.js";
import type { Transaction } from "../types";

/**
 * Attaches `tronResources` (frozen/unfrozen amounts, votes, unwithdrawn reward) to the account
 * shape. The whole Tron UI — staking screens, vote counts, resource displays — reads it.
 *
 * The coin module's `getAccountInfo` (ADR-045) cannot feed this, hence the ignored argument: it
 * reports collapsed energy/bandwidth totals, while `tronResources.bandwidth` carries the four raw
 * free/staked limits and `isAccountEmpty` reads one of them.
 */
export async function buildAccountShape(address: string): Promise<Record<string, unknown>> {
  const accounts = await fetchTronAccount(address);
  // An unactivated address still gets the zeroed defaults. Leaving `tronResources` absent instead
  // would invert `isAccountEmpty` — it reads `bandwidth.freeLimit.eq(0)`, so no resources means
  // "not empty" — and would hide the staking actions, which gate on `mainAccount.tronResources`
  // being present.
  if (accounts.length === 0) return { tronResources: defaultTronResources };
  return { tronResources: await fetchTronResources(accounts[0]) };
}

export async function getTokenFromAsset(
  currency: CryptoCurrency,
  asset: AssetInfo,
): Promise<TokenCurrency | undefined> {
  if (asset.type === "native" || !("assetReference" in asset) || !asset.assetReference) {
    return undefined;
  }
  const store = getCryptoAssetsStore();
  // TRC10 tokens are keyed by their numeric asset id (`<currency>/trc10/<id>`), TRC20 tokens by
  // their contract address.
  if (asset.type === "trc10") {
    return store.findTokenById(`${currency.id}/trc10/${asset.assetReference}`);
  }
  return store.findTokenByAddressInCurrency(asset.assetReference, currency.id);
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

/**
 * Every mode the Tron UI can produce. Resource staking is a real user-facing mode set — freeze,
 * unfreeze and friends each map to their own Tron contract — so they are intent *types*; the
 * structural fields they need (`resource`, `votes`, `duration`) travel separately, see
 * {@link buildIntentData}.
 *
 * Widened to `string[]` so the untrusted `transaction.mode` can be tested against it, while
 * `satisfies` pins every entry to coin-tron's union: a mode renamed there stops compiling here.
 */
const SUPPORTED_MODES: readonly string[] = [
  "send",
  "freeze",
  "unfreeze",
  "vote",
  "claimReward",
  "withdrawExpireUnfreeze",
  "unDelegateResource",
  "legacyUnfreeze",
] satisfies TronOperationMode[];

export function computeIntentType(transaction: Record<string, unknown>): string {
  const mode = transaction.mode as string | undefined;

  if (mode === undefined) return "send";
  if (SUPPORTED_MODES.includes(mode)) return mode;
  throw new Error(`Unsupported Tron transaction mode: ${mode}`);
}

/**
 * Maps the wallet's Tron transaction onto the coin module's `TronTxData`, which reaches
 * `coin-tron` as `intent.data`.
 *
 * This is the family side of ADR-047: the generic layer transports `familySpecificData` as an opaque
 * bag and never inspects it, and coin-tron declares the typed shape — so this function is the single
 * place that knows both. Fields are read individually rather than spread, so a stray key on the
 * transaction can never reach the coin module.
 */
export function buildIntentData(transaction: Record<string, unknown>): TronTxData {
  // The shared hook is typed `Record<string, unknown>`; narrow once here so the field reads below are
  // checked rather than each being asserted.
  const { mode, familySpecificData = {} } = transaction as Partial<Transaction>;
  const { resource, votes, duration } = familySpecificData;

  return {
    type: "tron",
    ...(resource !== undefined ? { resource } : {}),
    ...(votes !== undefined ? { votes } : {}),
    // Carried for round-trip fidelity with the wallet transaction only: no coin-tron code reads it,
    // because Stake 2.0's `freezebalancev2` contract has no duration field.
    ...(duration !== undefined ? { duration } : {}),
    ...(mode !== undefined ? { mode } : {}),
  };
}

/**
 * Resource staking gets its own operation types, which the generic mode→type mapping doesn't model.
 */
// A Map rather than an object literal so a mode called `constructor`/`toString` can't resolve to an
// inherited member and beat the generic fallback.
const RESOURCE_STAKING_OPERATION_TYPES: ReadonlyMap<string, OperationType> = new Map(
  Object.entries({
    freeze: "FREEZE",
    unfreeze: "UNFREEZE",
    vote: "VOTE",
    withdrawExpireUnfreeze: "WITHDRAW_EXPIRE_UNFREEZE",
    unDelegateResource: "UNDELEGATE_RESOURCE",
    legacyUnfreeze: "LEGACY_UNFREEZE",
  } satisfies Partial<Record<TronOperationMode, OperationType>>),
);

export function describeOptimisticOperation(
  mode: string,
  account: Account,
): OptimisticOperationDescriptor | undefined {
  const type = RESOURCE_STAKING_OPERATION_TYPES.get(mode);
  // Every one of those modes locks or releases the account's own funds rather than sending them, so
  // the operation records no value. Deliberately not `OPERATION_TYPE_STAKE_FAMILY`, which also covers
  // the `stake`/`unstake` modes other families send through the framework *with* a value.
  if (type !== undefined) return { type, value: new BigNumber(0) };

  // A claim carries no amount — the chain pays out whatever has accrued — so without this the pending
  // row would read 0 TRX until the next sync. Its type is left to the generic mapping, which already
  // resolves `claimReward` to `REWARD`.
  if (mode === "claimReward") {
    const reward = (account as TronAccount).tronResources?.unwithdrawnReward;
    return reward === undefined ? undefined : { value: reward };
  }

  return undefined;
}

/**
 * app-tron needs the token's CAL signature to clear-sign a TRC-10 token's name and decimals, and the
 * framework does not model that — `families/tron/signer.ts` reads it back off these options. Which
 * token standards need a signature is that signer's rule, so the token goes across whole.
 */
export function getDeviceSignOptions(
  transaction: Record<string, unknown>,
  account: Account,
): Record<string, unknown> | undefined {
  const { subAccountId } = transaction as Partial<Transaction>;
  const token = subAccountId
    ? account.subAccounts?.find(sub => sub.id === subAccountId)?.token
    : undefined;
  if (!token) return undefined;
  return { token: { id: token.id, ledgerSignature: token.ledgerSignature } };
}

export default function tronBridge(currency: CryptoCurrency): BridgeApi {
  return {
    getTokenFromAsset: async (asset: AssetInfo) => getTokenFromAsset(currency, asset),
    getAssetFromToken: (token: TokenCurrency, owner: string) => getAssetFromToken(token, owner),
    computeIntentType: (transaction: Record<string, unknown>) => computeIntentType(transaction),
    buildIntentData,
    buildAccountShape,
    describeOptimisticOperation,
    getDeviceSignOptions,
  };
}
