import type { AccountInfo, AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { buildIterateResult } from "@ledgerhq/coin-hedera/bridge/synchronisation";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/coin-hedera/constants";
import type { HederaAccountInfo } from "@ledgerhq/coin-hedera/logic/getAccountInfo";
import type { HederaResources, HederaTxData } from "@ledgerhq/coin-hedera/types";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type {
  BridgeApi,
  FamilyAccountShape,
  OptimisticOperationDescriptor,
} from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { isStakingAccount, type Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

// Hedera accounts are looked up by public key on the mirror node, not derived from the path — see
// docs/hedera-generic-adapter/gaps/GAP-A-buildIterateResult.md.
export { buildIterateResult };

function isHederaAccountInfo(info: AccountInfo): info is HederaAccountInfo {
  return info.type === "hedera";
}

// `getAccountInfo` (ADR-045) is the only source for these three fields — the shared account shape
// has no room for them, and coin-hedera's `getBalance` doesn't expose the mirror account it already
// fetches internally. `delegated` mirrors the legacy bridge's choice of the whole account balance
// (`bridge/synchronisation.ts:112`): Hedera stakes the account's full balance to a node, there is no
// separate staked amount to track.
export function buildAccountShape(
  _address: string,
  accountInfo?: AccountInfo,
): FamilyAccountShape | undefined {
  if (!accountInfo || !isHederaAccountInfo(accountInfo)) return undefined;

  const delegation =
    typeof accountInfo.stakedNodeId === "number"
      ? {
          nodeId: accountInfo.stakedNodeId,
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

// The default mapping (`generic-coin-framework/utils.ts`'s `defaultComputeIntentType`) only allows
// `["changeTrust","send","send-legacy","send-eip1559","stake","unstake","finalize_unstake"]` —
// `redelegate` and `claimReward` fall through to its `throw new Error("Unsupported transaction
// mode…")`, which `transactionToIntent` calls before `validateIntent`/`signOperation` ever run. A
// custom hook replaces that default entirely, so passing every generic mode through unchanged covers
// four of the six without relying on the default's incidental allowance of two of them.
//
// `tokenAssociate` is the one mode this hook does translate (LIVE-36150): coin-hedera's own crafting
// and fee-routing logic (`logic/craftTransaction.ts`, `logic/utils.ts`'s `mapIntentToSDKOperation`,
// `logic/validateIntent.ts`) were written against the legacy `HEDERA_TRANSACTION_MODES.TokenAssociate`
// ("token-associate") string and dispatch on exact equality — passing `"tokenAssociate"` through
// unchanged would silently miss every one of those checks and fall through to a plain coin-transfer
// builder instead of an association. Mapping here, at the one hook the framework calls before any of
// that code sees the intent, means none of coin-hedera's internal dispatch has to learn a second
// vocabulary. Association gets its own mode rather than reusing Stellar's `changeTrust`: the framework
// maps `changeTrust` to the `OPT_IN` operation type, but coin-hedera types a synced association
// `ASSOCIATE_TOKEN` — `tokenAssociate` carries its own `ASSOCIATE_TOKEN` default
// (`generic-coin-framework/utils.ts`'s `defaultOperationType`) so the two ends agree from the start.
export function computeIntentType(transaction: Record<string, unknown>): string {
  const mode = transaction.mode as string | undefined;
  if (mode === "tokenAssociate") return HEDERA_TRANSACTION_MODES.TokenAssociate;
  return mode ?? "send";
}

// coin-hedera has no `craftTransactionData` of its own — it uses the framework's no-op default
// (`{type: "none"}`) — so without this hook, `logic/craftTransaction.ts`'s staking branch (which
// reads `stakingNodeId` from `intent.data`, never from `intent.valId` directly) always sees
// `undefined` and neither sets nor clears the account's staked node. A delegate/redelegate/undelegate
// transaction would sign and broadcast looking correct while silently changing nothing (LIVE-36151).
// `claimReward` needs no entry: `logic/craftTransaction.ts` treats it as a plain coin transfer and
// never reads `intent.data` on that path.
//
// The erc20 case (LIVE-36276 item 4) needs no mode check the way staking does: `transaction.gasLimit`
// is only ever populated by `genericPrepareTransaction`'s `propagateField`, itself only fed by
// `api/index.ts`'s `estimateFees` for a ContractCall operation, so its mere presence already implies
// an ERC20 send. `craftTransaction.ts`'s erc20 branch is the only place that reads this data's
// `gasLimit` (gated on `asset.type === "erc20"` there), so returning it for a send this turns out not
// to be ERC20 is inert, not wrong.
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

// Reward operations are synthesized by the mirror node rather than fetched as a transfer, so the
// optimistic row's value defaults to the transaction amount (0 for a claim, which carries none) —
// pin it to the pending rewards balance already known from the last sync so it matches what the
// following sync produces.
// Hedera's `getAddress` resolver has no derivable address to return — it sends the public key
// through as `address` (see `families/hedera/signer.ts`'s `hederaGetAddress` and coin-hedera's
// legacy `signer/getAddress.ts`, both documented there). The generic `receive()` default compares
// `result.address` against the account's real (mirror-node-looked-up) address, which can never
// match, so every receive would fail with `WrongDeviceForAccount`. Compare public keys instead —
// `seedIdentifier` is set to the public key for Hedera accounts (`bridge/synchronisation.ts`'s
// scan), mirroring the legacy bridge's own `bridge/receive.ts` check exactly.
export function matchesReceiveAddress(
  result: { publicKey: string },
  account: Pick<Account, "seedIdentifier">,
): boolean {
  return result.publicKey === account.seedIdentifier;
}

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
    matchesReceiveAddress,
    buildIterateResult,
    buildAccountShape,
    computeIntentType,
    buildIntentData,
    // getBalance already returns a stake carrying delegated/pendingReward/overstaked — the aggregate
    // shape. Hedera stakes to a single node id, so per-position mode (usesStakingPositions) has
    // nothing to group; leave it unset.
    stakingSupported: true,
  } satisfies BridgeApi;
}
